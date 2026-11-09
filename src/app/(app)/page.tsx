import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import HeroCarousel from "@/components/HeroCarousel";
import Calendar from "@/components/Calendar";

const TZ = "America/Sao_Paulo";
const MES_CURTO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export default async function HomePage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: TZ });
  const [y, m] = today.split("-").map(Number);
  const monthStart = `${y}-${String(m).padStart(2, "0")}-01`;
  const monthEnd = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);

  const [{ data: announcements }, { data: reads }, { data: events }, { data: upcoming }] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, category, summary, featured, requires_ack, publish_at")
      .order("publish_at", { ascending: false })
      .limit(30),
    supabase.from("announcement_reads").select("announcement_id, acked_at").eq("profile_id", profile.id),
    supabase.from("events").select("id, title, starts_on").gte("starts_on", monthStart).lte("starts_on", monthEnd),
    supabase.from("events").select("id, title, starts_on").gte("starts_on", today).order("starts_on").limit(4),
  ]);

  const readMap = new Map((reads ?? []).map((r) => [r.announcement_id as string, r.acked_at as string | null]));
  const list = announcements ?? [];
  const pending = list.filter((a) => a.requires_ack && !readMap.get(a.id));
  const slides = list
    .filter((a) => a.featured)
    .slice(0, 5)
    .map((a) => ({ id: a.id, category: a.category, title: a.title, summary: a.summary ?? "", requires_ack: a.requires_ack }));
  const latest = list.slice(0, 5);

  return (
    <>
      <h1>Olá, {profile.full_name?.split(" ")[0] ?? "bem-vindo"}</h1>

      <HeroCarousel slides={slides} />

      {pending.length > 0 && (
        <div className="banner" role="status">
          <strong>
            {pending.length === 1 ? "1 comunicado precisa" : `${pending.length} comunicados precisam`} da sua ciência
          </strong>
          <Link className="btn small" href={`/comunicados/${pending[0].id}`}>
            Confirmar leitura
          </Link>
        </div>
      )}

      <div className="grid2">
        <section aria-labelledby="ult">
          <h2 id="ult" style={{ marginTop: 0 }}>
            Últimos comunicados
          </h2>
          {latest.length === 0 && <p className="muted">Nenhum comunicado ainda.</p>}
          <div className="list">
            {latest.map((a) => (
              <Link key={a.id} href={`/comunicados/${a.id}`} className="card item">
                <div className="row">
                  <strong>{a.title}</strong>
                  {a.requires_ack && !readMap.get(a.id) ? (
                    <span className="badge warn">Confirmar leitura</span>
                  ) : !readMap.has(a.id) ? (
                    <span className="badge">Novo</span>
                  ) : null}
                </div>
                <div className="muted">
                  {a.category} · {formatDate(a.publish_at)}
                </div>
              </Link>
            ))}
          </div>
          <p>
            <Link href="/comunicados">Ver todos os comunicados</Link>
          </p>
        </section>

        <section aria-label="Calendário">
          <div className="card" style={{ marginTop: 0 }}>
            <Calendar year={y} month={m - 1} today={today} events={events ?? []} />
          </div>
          <div className="card">
            <strong>Próximos eventos</strong>
            {(upcoming ?? []).length === 0 && <p className="muted">Nenhum evento marcado.</p>}
            {(upcoming ?? []).map((e) => {
              const [, mm, dd] = e.starts_on.split("-").map(Number);
              return (
                <div key={e.id} className="ev-item">
                  <span className="ev-date">
                    {dd}
                    <small>{MES_CURTO[mm - 1]}</small>
                  </span>
                  <span>{e.title}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
