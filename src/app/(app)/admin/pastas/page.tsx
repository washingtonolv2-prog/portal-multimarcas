import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createFolder } from "./actions";

export default async function AdminPastasPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  await requireAdmin();
  const { erro, ok } = await searchParams;
  const supabase = await createClient();

  const [{ data: folders }, { data: stores }] = await Promise.all([
    supabase.from("library_folders").select("id, name, description, active").order("sort_order").order("name"),
    supabase.from("stores").select("id, name, brand").eq("active", true).order("name"),
  ]);

  return (
    <>
      <h1>Pastas de arquivos</h1>
      {erro && <div className="error">{erro}</div>}
      {ok && <div className="card">Pasta adicionada.</div>}

      <h2>Pastas ligadas</h2>
      {(folders ?? []).length === 0 && <p className="muted">Nenhuma pasta ainda.</p>}
      {(folders ?? []).map((f) => (
        <div key={f.id} className="card">
          <strong>{f.name}</strong> {!f.active && <span className="badge warn">Inativa</span>}
          {f.description && <div className="muted">{f.description}</div>}
        </div>
      ))}

      <h2>Ligar nova pasta do Dropbox</h2>
      <form action={createFolder} className="stack">
        <label>
          Nome no portal
          <input type="text" name="name" maxLength={120} required />
        </label>
        <label>
          Descrição (opcional)
          <input type="text" name="description" maxLength={300} />
        </label>
        <label>
          Caminho da pasta no Dropbox
          <input type="text" name="dropbox_path" placeholder="/Lojas/Tabelas de preço" required />
        </label>
        <div>
          <strong>Lojas</strong>
          <p className="muted">Sem nenhuma marcada, todas as lojas veem a pasta.</p>
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
          Ligar pasta
        </button>
      </form>
    </>
  );
}
