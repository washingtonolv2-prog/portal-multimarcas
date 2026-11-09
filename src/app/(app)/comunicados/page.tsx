import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime, UUID_RE } from "@/lib/format";
import { confirmRead } from "./[id]/actions";

const FILTERS = [
  { key: "todos", label: "Todos" },
  { key: "nao-lidos", label: "Não lidos" },
  { key: "ciencia", label: "Exigem ciência" },
] as const;

export default async function ComunicadosPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; f?: string }>;
}) {
  const { id: idParam, f } = await searchParams;
  const filter = FILTERS.some((x) => x.key === f) ? (f as string) : "todos";
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: announcements }, { data: reads }] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, summary, body, category, requires_ack, publish_at")
      .order("publish_at", { ascending: false })
      .limit(200),
    supabase.from("announcement_reads").select("announcement_id, acked_at").eq("profile_id", profile.id),
  ]);
  const readMap = new Map((reads ?? []).map((r) => [r.announcement_id as string, r.acked_at as string | null]));
  const all = announcements ?? [];

  const list = all.filter((a) => {
    if (filter === "nao-lidos") return !readMap.has(a.id);
    if (filter === "ciencia") return a.requires_ack && !readMap.get(a.id);
    return true;
  });

  const wanted = idParam && UUID_RE.test(idParam) ? idParam : null;
  const selected = list.find((a) => a.id === wanted) ?? all.find((a) => a.id === wanted) ?? list[0] ?? null;

  // Abrir um comunicado conta como lido.
  if (selected && !readMap.has(selected.id)) {
    await supabase
      .from("announcement_reads")
      .upsert(
        { announcement_id: selected.id, profile_id: profile.id },
        { onConflict: "announcement_id,profile_id", ignoreDuplicates: true },
      );
    readMap.set(selected.id, null);
  }
  const ackedAt = selected ? readMap.get(selected.id) : null;
  const href = (id: string, fk = filter) => `/comunicados?id=${id}${fk !== "todos" ? `&f=${fk}` : ""}`;

  return (
    <div className="page-wide">
      <h1>Comunicados</h1>
      <div className="split">
        <section aria-label="Lista de comunicados" className="split-list">
          <nav aria-label="Filtrar comunicados" className="chips">
            {FILTERS.map((x) => (
              <Link
                key={x.key}
                href={`/comunicados${x.key !== "todos" ? `?f=${x.key}` : ""}`}
                className={`chip${filter === x.key ? " on" : ""}`}
                aria-current={filter === x.key ? "true" : undefined}
              >
                {x.label}
              </Link>
            ))}
          </nav>
          {list.length === 0 && (
            <p className="muted" role="status">
              {filter === "todos" ? "Nenhum comunicado publicado ainda." : "Nenhum comunicado neste filtro."}
            </p>
          )}
          <ul className="cards">
            {list.map((a) => {
              const isRead = readMap.has(a.id);
              const acked = !!readMap.get(a.id);
              const current = selected?.id === a.id;
              return (
                <li key={a.id}>
                  <Link href={href(a.id)} className={`com-card${current ? " current" : ""}`} aria-current={current ? "true" : undefined}>
                    <span className="com-meta">
                      {formatDate(a.publish_at)}
                      {a.requires_ack && !acked ? (
                        <span className="badge warn">Exige ciência</span>
                      ) : !isRead ? (
                        <span className="badge">Novo</span>
                      ) : null}
                    </span>
                    <strong>{a.title}</strong>
                    {a.summary && <span className="muted">{a.summary}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <article aria-label="Comunicado selecionado" className="split-detail">
          {!selected ? (
            <p className="muted">Selecione um comunicado na lista.</p>
          ) : (
            <>
              {selected.requires_ack && <span className="badge warn">Exige ciência</span>}
              <h2 className="art-title">{selected.title}</h2>
              <p className="muted">
                {selected.category} · Publicado em {formatDateTime(selected.publish_at)}
              </p>
              {/* Texto puro: nunca renderizamos HTML vindo do banco. */}
              <div className="body-text">{selected.body}</div>
              {selected.requires_ack && (
                <div className="ack-box">
                  {ackedAt ? (
                    <p role="status">
                      <span className="badge">Leitura confirmada em {formatDateTime(ackedAt)}</span>
                    </p>
                  ) : (
                    <form action={confirmRead}>
                      <p>Ao confirmar, a gerência passa a ver que a sua loja leu este comunicado.</p>
                      <input type="hidden" name="id" value={selected.id} />
                      <button className="btn" type="submit">
                        Li e estou ciente
                      </button>
                    </form>
                  )}
                </div>
              )}
            </>
          )}
        </article>
      </div>
    </div>
  );
}
