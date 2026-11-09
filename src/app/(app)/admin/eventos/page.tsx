import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createEvent, deleteEvent } from "./actions";

export default async function EventosPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  await requireAdmin();
  const { erro } = await searchParams;
  const supabase = await createClient();
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const { data: events } = await supabase.from("events").select("id, title, starts_on").gte("starts_on", today).order("starts_on");

  return (
    <>
      <h1>Calendário</h1>
      <p className="muted">Eventos aparecem no calendário da página inicial de todas as lojas.</p>
      {erro && <div className="error">{erro}</div>}
      <form action={createEvent} className="card" style={{ display: "grid", gap: 14, maxWidth: 560 }}>
        <label>
          Evento
          <input type="text" name="title" maxLength={120} required />
        </label>
        <label>
          Data
          <input type="date" name="starts_on" min={today} required />
        </label>
        <div>
          <button className="btn" type="submit">
            Adicionar evento
          </button>
        </div>
      </form>
      <h2>Próximos eventos</h2>
      {(events ?? []).length === 0 && <p className="muted">Nenhum evento marcado.</p>}
      {(events ?? []).map((e) => (
        <div key={e.id} className="card row">
          <span>
            <strong>{e.title}</strong>
            <span className="muted"> · {e.starts_on.split("-").reverse().join("/")}</span>
          </span>
          <form action={deleteEvent}>
            <input type="hidden" name="id" value={e.id} />
            <button className="btn secondary small" type="submit">
              Remover
            </button>
          </form>
        </div>
      ))}
    </>
  );
}
