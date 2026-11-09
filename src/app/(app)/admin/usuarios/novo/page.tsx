import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MIN_PASSWORD, ROLES } from "@/lib/roles";
import { createUser } from "./actions";

export default async function NovoUsuarioPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  await requireAdmin();
  const { erro } = await searchParams;
  const supabase = await createClient();
  const { data: stores } = await supabase.from("stores").select("id, name, brand").eq("active", true).order("name");

  return (
    <>
      <p className="crumbs">
        <Link href="/admin/usuarios">← Usuários</Link>
      </p>
      <h1>Novo usuário</h1>
      {erro && <div className="error">{erro}</div>}
      <form action={createUser} className="stack">
        <label>
          Nome
          <input type="text" name="full_name" maxLength={120} required />
        </label>
        <label>
          E-mail
          <input type="email" name="email" autoComplete="off" required />
        </label>
        <label>
          Senha temporária (mínimo {MIN_PASSWORD} caracteres)
          <input type="password" name="password" minLength={MIN_PASSWORD} autoComplete="new-password" required />
        </label>
        <p className="muted">Passe a senha à pessoa por um canal seguro. Ela pode trocá-la em &quot;Minha conta&quot;.</p>
        <label>
          Perfil
          <select name="role" defaultValue="loja">
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <div>
          <strong>Lojas</strong>
          <p className="muted">Usadas só no perfil Loja. Administrador e Supervisor veem todas.</p>
          <div className="fieldset">
            {(stores ?? []).map((s) => (
              <label key={s.id} className="check">
                <input type="checkbox" name="store_ids" value={s.id} /> {s.name}
                {s.brand ? ` (${s.brand})` : ""}
              </label>
            ))}
          </div>
        </div>
        <button className="btn" type="submit">
          Criar usuário
        </button>
      </form>
    </>
  );
}
