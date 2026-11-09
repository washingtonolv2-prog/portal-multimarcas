-- Portal interno multimarcas: schema inicial com RLS.
-- Arquivos NAO ficam no Supabase: apenas referencias (ids do Dropbox) e controle de acesso.

create type public.app_role as enum ('admin', 'supervisor', 'loja');

-- ---------- Tabelas ----------
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  state text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.app_role not null default 'loja',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profile_stores (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  primary key (profile_id, store_id)
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  requires_ack boolean not null default false,
  publish_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Sem linhas aqui = comunicado para todas as lojas.
create table public.announcement_stores (
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  primary key (announcement_id, store_id)
);

create table public.announcement_reads (
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  acked_at timestamptz,
  primary key (announcement_id, profile_id)
);

-- Pasta da biblioteca = ponteiro para uma pasta do Dropbox, pelo ID (sobrevive a mover/renomear).
create table public.library_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  dropbox_folder_id text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Sem linhas aqui = pasta visivel para todas as lojas.
create table public.library_folder_stores (
  folder_id uuid not null references public.library_folders (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  primary key (folder_id, store_id)
);

create table public.download_log (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  folder_id uuid references public.library_folders (id) on delete set null,
  dropbox_file_id text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

create index on public.announcements (publish_at desc);
create index on public.announcement_reads (profile_id);
create index on public.download_log (created_at desc);

-- ---------- Funcoes auxiliares (security definer, sem recursao de RLS) ----------
create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.active);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.active and p.role = 'admin');
$$;

create or replace function public.can_see_all()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.active and p.role in ('admin', 'supervisor'));
$$;

create or replace function public.user_store_ids()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select ps.store_id from public.profile_stores ps where ps.profile_id = auth.uid();
$$;

-- Cria o perfil automaticamente quando um usuario e convidado/criado no Supabase Auth.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- RLS ----------
alter table public.stores enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_stores enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_stores enable row level security;
alter table public.announcement_reads enable row level security;
alter table public.library_folders enable row level security;
alter table public.library_folder_stores enable row level security;
alter table public.download_log enable row level security;

-- stores
create policy stores_select on public.stores for select to authenticated
  using (public.is_active_user());
create policy stores_admin_all on public.stores for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- profiles (usuario nao pode alterar o proprio perfil/role; so admin)
create policy profiles_select_self on public.profiles for select to authenticated
  using (id = auth.uid() or public.can_see_all());
create policy profiles_admin_update on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- profile_stores
create policy profile_stores_select on public.profile_stores for select to authenticated
  using (profile_id = auth.uid() or public.can_see_all());
create policy profile_stores_admin_all on public.profile_stores for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- announcements
create policy announcements_select on public.announcements for select to authenticated
  using (
    public.is_active_user()
    and (
      public.is_admin()
      or (
        publish_at <= now()
        and (expires_at is null or expires_at > now())
        and (
          public.can_see_all()
          or not exists (select 1 from public.announcement_stores s where s.announcement_id = announcements.id)
          or exists (
            select 1 from public.announcement_stores s
            where s.announcement_id = announcements.id and s.store_id in (select public.user_store_ids())
          )
        )
      )
    )
  );
create policy announcements_admin_all on public.announcements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy announcement_stores_select on public.announcement_stores for select to authenticated
  using (public.is_active_user());
create policy announcement_stores_admin_all on public.announcement_stores for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- announcement_reads
create policy reads_select on public.announcement_reads for select to authenticated
  using (profile_id = auth.uid() or public.can_see_all());
-- So registra leitura de comunicados que o usuario realmente pode ver (a subconsulta tambem passa pelo RLS).
create policy reads_insert_own on public.announcement_reads for insert to authenticated
  with check (
    profile_id = auth.uid()
    and public.is_active_user()
    and exists (select 1 from public.announcements a where a.id = announcement_id)
  );
create policy reads_update_own on public.announcement_reads for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- library_folders
create policy folders_select on public.library_folders for select to authenticated
  using (
    public.is_active_user()
    and (
      public.is_admin()
      or (
        active
        and (
          public.can_see_all()
          or not exists (select 1 from public.library_folder_stores s where s.folder_id = library_folders.id)
          or exists (
            select 1 from public.library_folder_stores s
            where s.folder_id = library_folders.id and s.store_id in (select public.user_store_ids())
          )
        )
      )
    )
  );
create policy folders_admin_all on public.library_folders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy folder_stores_select on public.library_folder_stores for select to authenticated
  using (public.is_active_user());
create policy folder_stores_admin_all on public.library_folder_stores for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- download_log
create policy download_log_insert_own on public.download_log for insert to authenticated
  with check (profile_id = auth.uid() and public.is_active_user());
create policy download_log_select on public.download_log for select to authenticated
  using (profile_id = auth.uid() or public.can_see_all());
