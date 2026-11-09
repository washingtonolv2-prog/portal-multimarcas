import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/format";
import { MIN_PASSWORD, ROLES } from "@/lib/roles";
import { resetPassword, saveUser } from "./actions";

export default async function EditarUsuarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { erro, ok } = await searchParams;
  if (!UUID_RE.test(id)) notFound();

  const me = await requireAdmin();
  const supabase = await createClient();

  const [{ data: user }, { data: stores }, { data: links }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, role, active").eq("id", id).maybeSingle(),
    supabase.from("stores").select("id, name, brand").eq("active", true).order("name"),
    supabase.from("profile_stores").select("store_id").eq("profile_id", id),
  ]);
  if (!user) notFound();

  const selected = new Set((links ?? []).map((l) => l.store_id as string));
  const isSelf = user.id === me.id;

  return (
    <>
      <p className="crumbs">
        <Link href="/admin/usuarios">← Usuários</Link>
      </p>
      <h1>{user.full_name || user.email}</h1>
      <p className="muted">{user.email}</p>
      {erro && <div className="error">{erro}</div>}
      {ok && <div className="card">{ok}</div>}

      <form action={saveUser} className="stack">
        <input type="hidden" name="id" value={user.id} />
        <label>
          Nome
          <input type="text" name="full_name" defaultValue={user.full_name ?? ""} maxLength={120} required />
        </label>
        <label>
          Perfil
          <select name="role" defaultValue={user.role} disabled={isSelf}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        {isSelf && <input type="hidden" name="role" value={user.role} />}
        <label className="check">
          <input type="checkbox" name="active" defaultChecked={user.active} disabled={isSelf} />
          Acesso ativo
        </label>
        {isSelf && <input type="hidden" name="active" value="on" />}
        {isSelf && <p className="muted">Você não pode alterar o próprio perfil nem desativar a própria conta.</p>}
        <div>
          <strong>Lojas</strong>
          <p className="muted">Usadas só no perfil Loja. Administrador e Supervisor veem todas.</p>
          <div className="fieldset">
            {(stores ?? []).map((s) => (
              <label key={s.id} className="check">
                <input type="checkbox" name="store_ids" value={s.id} defaultChecked={selected.has(s.id)} /> {s.name}
                {s.brand ? ` (${s.brand})` : ""}
              </label>
            ))}
          </div>
        </div>
        <button className="btn" type="submit">
          Salvar
        </button>
      </form>

      <h2>Redefinir senha</h2>
      <form action={resetPassword} className="stack">
        <input type="hidden" name="id" value={user.id} />
        <label>
          Nova senha temporária (mínimo {MIN_PASSWORD} caracteres)
          <input type="password" name="password" minLength={MIN_PASSWORD} autoComplete="new-password" required />
        </label>
        <button className="btn secondary" type="submit">
          Redefinir senha
        </button>
      </form>
    </>
  );
}
