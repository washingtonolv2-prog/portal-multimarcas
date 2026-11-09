alter table public.announcements
  add column if not exists category text not null default 'Aviso',
  add column if not exists summary text,
  add column if not exists featured boolean not null default true;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_on date not null,
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists events_starts_on_idx on public.events (starts_on);
alter table public.events enable row level security;
create policy events_select on public.events for select to authenticated using (public.is_active_user());
create policy events_admin_all on public.events for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.events add column if not exists kind text not null default 'evento' check (kind in ('evento','prazo','feriado'));
