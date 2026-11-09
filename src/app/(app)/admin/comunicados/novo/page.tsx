import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAnnouncement } from "./actions";

export default async function NovoComunicadoPage({
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
      <h1>Novo comunicado</h1>
      {erro && <div className="error">{erro}</div>}
      <form action={createAnnouncement} className="stack">
        <label>
          Título
          <input type="text" name="title" maxLength={200} required />
        </label>
        <label>
          Mensagem
          <textarea name="body" required />
        </label>
        <label className="check">
          <input type="checkbox" name="requires_ack" /> Exigir confirmação de leitura
        </label>
        <label>
          Publicar em (deixe vazio para agora)
          <input type="datetime-local" name="publish_at" />
        </label>
        <label>
          Expira em (opcional)
          <input type="datetime-local" name="expires_at" />
        </label>
        <div>
          <strong>Lojas</strong>
          <p className="muted">Sem nenhuma marcada, o comunicado vai para todas as lojas.</p>
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
          Publicar
        </button>
      </form>
    </>
  );
}
