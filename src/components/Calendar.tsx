import Link from "next/link";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DIAS = ["D", "S", "T", "Q", "Q", "S", "S"];
export const KIND_COLOR: Record<string, string> = { evento: "#1B5E47", prazo: "#B3641A", feriado: "#3F6FBF" };
export type CalEvent = { id: string; title: string; starts_on: string; kind: string };

export default function Calendar({ year, month, today, events }: { year: number; month: number; today: string; events: CalEvent[] }) {
  const lead = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const iso = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const byDay = new Map<string, CalEvent>();
  for (const e of events) if (!byDay.has(e.starts_on)) byDay.set(e.starts_on, e);
  const prev = new Date(Date.UTC(year, month - 1, 1));
  const next = new Date(Date.UTC(year, month + 1, 1));
  const q = (d: Date) => `/?mes=${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

  return (
    <section className="cal-card" aria-label={`Calendário de ${MESES[month].toLowerCase()} de ${year}`}>
      <div className="cal-head">
        <h2>
          {MESES[month]} {year}
        </h2>
        <div>
          <Link className="cal-nav" href={q(prev)} aria-label="Mês anterior">
            ‹
          </Link>
          <Link className="cal-nav" href={q(next)} aria-label="Próximo mês">
            ›
          </Link>
        </div>
      </div>
      <div className="cal-grid">
        {DIAS.map((d, k) => (
          <span key={k} className="cal-dow" aria-hidden="true">
            {d}
          </span>
        ))}
        {Array.from({ length: lead }, (_, k) => (
          <div key={`e${k}`} />
        ))}
        {Array.from({ length: days }, (_, k) => {
          const d = k + 1;
          const ev = byDay.get(iso(d));
          const isToday = iso(d) === today;
          return (
            <div key={d} className={`cal-day${isToday ? " today" : ""}`} aria-label={`${d}${ev ? `, ${ev.title}` : ""}${isToday ? ", hoje" : ""}`}>
              <span>{d}</span>
              {ev && <i style={{ background: isToday ? "#fff" : KIND_COLOR[ev.kind] ?? KIND_COLOR.evento }} />}
            </div>
          );
        })}
      </div>
      <div className="cal-legend">
        <span><i style={{ background: KIND_COLOR.evento }} />Evento da empresa</span>
        <span><i style={{ background: KIND_COLOR.prazo }} />Prazo ou atenção</span>
        <span><i style={{ background: KIND_COLOR.feriado }} />Feriado</span>
      </div>
    </section>
  );
}
