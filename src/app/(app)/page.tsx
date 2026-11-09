import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import HeroCarousel from "@/components/HeroCarousel";
import Calendar, { KIND_COLOR } from "@/components/Calendar";

const TZ = "America/Sao_Paulo";
const MES_CURTO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const KIND_LABEL: Record<string, string> = { evento: "Evento da empresa", prazo: "Prazo ou atenção", feriado: "Feriado" };

export default async function HomePage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const profile = await requireProfile();
  const { mes } = await searchParams;
  const supabase = await createClient();

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: TZ });
  const hour = Number(new Date().toLocaleString("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }));
  const saudacao = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const m0 = /^\d{4}-(0[1-9]|1[0-2])$/.test(mes ?? "") ? (mes as string) : today.slice(0, 7);
  const [y, m] = m0.split("-").map(Number);
  const monthStart = `${m0}-01`;
  const monthEnd = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);

  const [{ data: announcements }, { data: reads }, { data: events }, { data: upcoming }, { data: folders }, { data: myStores }] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, category, summary, featured, requires_ack, publish_at")
      .order("publish_at", { ascending: false })
      .limit(30),
    supabase.from("announcement_reads").select("announcement_id, acked_at").eq("profile_id", profile.id),
    supabase.from("events").select("id, title, starts_on, kind").gte("starts_on", monthStart).lte("starts_on", monthEnd),
    supabase.from("events").select("id, title, starts_on, kind").gte("starts_on", today).order("starts_on").limit(4),
    supabase.from("library_folders").select("id, name, description").eq("active", true).order("sort_order").limit(4),
    supabase.from("profile_stores").select("stores(name)").eq("profile_id", profile.id),
  ]);

  const readMap = new Map((reads ?? []).map((r) => [r.announcement_id as string, r.acked_at as string | null]));
  const list = announcements ?? [];
  const pending = list.filter((a) => a.requires_ack && !readMap.get(a.id));
  const slides = list
    .filter((a) => a.featured)
    .slice(0, 5)
    .map((a) => ({ id: a.id, category: a.category, title: a.title, summary: a.summary ?? "", requires_ack: a.requires_ack, date: formatDate(a.publish_at) }));
  const latest = list.slice(0, 5);
  const storeNames = (myStores ?? []).flatMap((r) => {
    const s = (r as unknown as { stores: { name: string } | { name: string }[] | null }).stores;
    return Array.isArray(s) ? s.map((x) => x.name) : s ? [s.name] : [];
  });

  return (
    <div className="home">
      <div>
        <h1 className="home-h1">
          {saudacao}, {profile.full_name?.split(" ")[0] ?? "bem-vindo"}
        </h1>
        <p className="home-sub">Veja o que mudou nas suas lojas desde o último acesso.</p>
      </div>

      <HeroCarousel slides={slides} />

      {pending.length > 0 && (
        <div className="ack-banner" role="status">
          <div>
            <strong>
              {pending.length === 1 ? "1 comunicado aguarda" : `${pending.length} comunicados aguardam`} a sua ciência
            </strong>
            <span>Confirme a leitura para que a gerência saiba que a loja recebeu.</span>
          </div>
          <Link href={`/comunicados/${pending[0].id}`}>Ler agora</Link>
        </div>
      )}

      <div className="home-cols">
        <div className="home-main">
          <section className="panel">
            <div className="panel-head">
              <h2>Últimos comunicados</h2>
              <Link href="/comunicados">Ver todos</Link>
            </div>
            {latest.length === 0 && <p className="muted" style={{ padding: "8px 0 16px" }}>Nenhum comunicado ainda.</p>}
            {latest.map((a) => {
              const unread = !readMap.has(a.id);
              return (
                <Link key={a.id} href={`/comunicados/${a.id}`} className="news">
                  <span className="news-dot" style={{ background: unread ? "#1B5E47" : "#C5CBC3" }} />
                  <span className="news-txt">
                    <b>{a.title}</b>
                    {a.summary && <span>{a.summary}</span>}
                  </span>
                  <span className="news-side">
                    <span>{formatDate(a.publish_at)}</span>
                    {a.requires_ack && !readMap.get(a.id) ? <em className="b-warn">Exige ciência</em> : unread ? <em className="b-new">Novo</em> : null}
                  </span>
                </Link>
              );
            })}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Pastas de arquivos</h2>
              <Link href="/arquivos">Abrir arquivos</Link>
            </div>
            {(folders ?? []).length === 0 && <p className="muted" style={{ padding: "8px 0 16px" }}>Nenhuma pasta liberada ainda.</p>}
            {(folders ?? []).map((f) => (
              <Link key={f.id} href={`/arquivos/${f.id}`} className="file">
                <span className="file-ic">DIR</span>
                <span className="news-txt">
                  <b>{f.name}</b>
                  {f.description && <span>{f.description}</span>}
                </span>
              </Link>
            ))}
          </section>
        </div>

        <aside className="home-side">
          <Calendar year={y} month={m - 1} today={today} events={events ?? []} />

          <section className="panel">
            <div className="panel-head">
              <h2>Próximos eventos</h2>
            </div>
            {(upcoming ?? []).length === 0 && <p className="muted" style={{ padding: "0 0 16px" }}>Nenhum evento marcado.</p>}
            {(upcoming ?? []).map((e) => {
              const [, mm, dd] = e.starts_on.split("-").map(Number);
              return (
                <div key={e.id} className="ev-row">
                  <span className="ev-box" style={{ background: "#E3F0EA" }}>
                    <b>{dd}</b>
                    <small>{MES_CURTO[mm - 1]}</small>
                  </span>
                  <span className="news-txt">
                    <b>{e.title}</b>
                    <span style={{ color: KIND_COLOR[e.kind] ?? KIND_COLOR.evento }}>{KIND_LABEL[e.kind] ?? "Evento da empresa"}</span>
                  </span>
                </div>
              );
            })}
          </section>

          {storeNames.length > 0 && (
            <section className="panel">
              <div className="panel-head">
                <h2>Suas lojas</h2>
              </div>
              <div className="chips">
                {storeNames.map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
