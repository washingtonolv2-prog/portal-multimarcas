const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const DIAS = ["D", "S", "T", "Q", "Q", "S", "S"];

export type CalEvent = { id: string; title: string; starts_on: string };

export default function Calendar({ year, month, today, events }: { year: number; month: number; today: string; events: CalEvent[] }) {
  const first = new Date(Date.UTC(year, month, 1));
  const lead = first.getUTCDay();
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const withEv = new Set(events.map((e) => e.starts_on));
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, k) => k + 1)];
  while (cells.length % 7) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let r = 0; r < cells.length; r += 7) rows.push(cells.slice(r, r + 7));
  const iso = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return (
    <table className="cal" aria-label={`Calendário de ${MESES[month]} de ${year}`}>
      <caption style={{ textAlign: "left", fontWeight: 700, padding: "0 0 8px", textTransform: "capitalize" }}>
        {MESES[month]} de {year}
      </caption>
      <thead>
        <tr>
          {DIAS.map((d, n) => (
            <th key={n} scope="col">
              {d}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, n) => (
          <tr key={n}>
            {r.map((d, k) => (
              <td key={k}>
                {d && (
                  <span className={`day${iso(d) === today ? " today" : ""}${withEv.has(iso(d)) ? " ev" : ""}`} aria-label={`${d}${withEv.has(iso(d)) ? ", com evento" : ""}${iso(d) === today ? ", hoje" : ""}`}>
                    {d}
                  </span>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
