import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { roleLabel } from "@/lib/roles";

export default async function AdminUsuariosPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: profiles }, { data: links }, { data: stores }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, role, active").order("full_name"),
    supabase.from("profile_stores").select("profile_id, store_id"),
    supabase.from("stores").select("id, name"),
  ]);

  const storeName = new Map((stores ?? []).map((s) => [s.id as string, s.name as string]));
  const storesByUser = new Map<string, string[]>();
  for (const l of links ?? []) {
    const arr = storesByUser.get(l.profile_id) ?? [];
    arr.push(storeName.get(l.store_id) ?? "?");
    storesByUser.set(l.profile_id, arr);
  }

  return (
    <>
      <div className="row">
        <h1>Usuários</h1>
        <Link className="btn" href="/admin/usuarios/novo">
          Novo usuário
        </Link>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Perfil</th>
              <th>Lojas</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((p) => {
              const userStores = storesByUser.get(p.id) ?? [];
              return (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/usuarios/${p.id}`}>{p.full_name || p.email}</Link>
                    <div className="muted">{p.email}</div>
                  </td>
                  <td>{roleLabel(p.role)}</td>
                  <td className="muted">
                    {p.role === "loja" ? (userStores.length ? userStores.join(", ") : "Nenhuma") : "Todas"}
                  </td>
                  <td>{p.active ? <span className="badge">Ativo</span> : <span className="badge warn">Inativo</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
