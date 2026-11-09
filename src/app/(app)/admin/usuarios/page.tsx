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
    <div className="page-wide">
      <h1>Usuários</h1>
      <div className="row">
        <p className="muted">Quem acessa o portal e de quais lojas vê os comunicados e arquivos.</p>
        <Link className="btn" href="/admin/usuarios/novo">
          Novo usuário
        </Link>
      </div>
      <div className="card table-wrap">
        <table>
          <caption className="sr-only">Lista de usuários do portal</caption>
          <thead>
            <tr>
              <th scope="col">Pessoa</th>
              <th scope="col">Perfil</th>
              <th scope="col">Lojas</th>
              <th scope="col">Situação</th>
              <th scope="col" style={{ textAlign: "right" }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((p) => {
              const userStores = storesByUser.get(p.id) ?? [];
              return (
                <tr key={p.id}>
                  <td>
                    <strong>{p.full_name || p.email}</strong>
                    <div className="muted">{p.email}</div>
                  </td>
                  <td>
                    <span className={`badge${p.role === "admin" ? "" : " gray"}`}>{roleLabel(p.role)}</span>
                  </td>
                  <td>{p.role === "loja" ? (userStores.length ? userStores.join(", ") : "Nenhuma") : "Todas"}</td>
                  <td>
                    <span className={`status ${p.active ? "ok" : "off"}`}>
                      <span aria-hidden="true" className="dot" />
                      {p.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link href={`/admin/usuarios/${p.id}`} aria-label={`Editar ${p.full_name || p.email}`}>
                      Editar
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
