import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createStore } from "./actions";

export default async function AdminLojasPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: stores } = await supabase.from("stores").select("id, name, brand, state, active").order("name");

  return (
    <>
      <h1>Lojas</h1>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Marca</th>
              <th>UF</th>
            </tr>
          </thead>
          <tbody>
            {(stores ?? []).map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td className="muted">{s.brand}</td>
                <td className="muted">{s.state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Nova loja</h2>
      <form action={createStore} className="stack">
        <label>
          Nome
          <input type="text" name="name" required maxLength={120} />
        </label>
        <label>
          Marca (opcional)
          <input type="text" name="brand" maxLength={80} />
        </label>
        <label>
          UF (opcional)
          <input type="text" name="state" maxLength={2} />
        </label>
        <button className="btn" type="submit">
          Cadastrar
        </button>
      </form>
    </>
  );
}
