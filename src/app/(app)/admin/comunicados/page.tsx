import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";

const FILTROS = ["todos", "publicados", "agendados"] as const;
const NOMES: Record<string, string> = { todos: "Todos", publicados: "Publicados", agendados: "Agendados" };

export default async function AdminComunicadosPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; ok?: string; n?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const filtro = (FILTROS as readonly string[]).includes(sp.f ?? "") ? (sp.f as string) : "todos";
  const supabase = await createClient();

  const [{ data: announcements }, { data: reads }, { data: stores }, { data: targets }, { data: ps }] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, category, requires_ack, publish_at, expires_at")
      .order("publish_at", { ascending: false })
      .limit(100),
    supabase.from("announcement_reads").select("announcement_id, profile_id, acked_at"),
    supabase.from("stores").select("id, name").eq("active", true).order("name"),
    supabase.from("announcement_stores").select("announcement_id, store_id"),
    supabase.from("profile_stores").select("profile_id, store_id"),
  ]);

  const now = Date.now();
  const storeName = new Map((stores ?? []).map((s) => [s.id as string, s.name as string]));
  const profileStores = new Map<string, string[]>();
  for (const r of ps ?? []) profileStores.set(r.profile_id, [...(profileStores.get(r.profile_id) ?? []), r.store_id]);
  const ackedStores = new Map<string, Set<string>>();
  for (const r of reads ?? []) {
    if (!r.acked_at) continue;
    const set = ackedStores.get(r.announcement_id) ?? new Set<string>();
    for (const sid of profileStores.get(r.profile_id) ?? []) set.add(sid);
    ackedStores.set(r.announcement_id, set);
  }
  const targetMap = new Map<string, string[]>();
  for (const t of targets ?? []) targetMap.set(t.announcement_id, [...(targetMap.get(t.announcement_id) ?? []), t.store_id]);

  const items = (announcements ?? []).filter((a) => {
    const future = new Date(a.publish_at).getTime() > now;
    return filtro === "todos" ? true : filtro === "agendados" ? future : !future;
  });

  return (
    <>
      <div className="row">
        <div>
          <h1 style={{ marginBottom: 4 }}>Comunicados</h1>
          <p className="muted" style={{ margin: 0 }}>
            Publique avisos e acompanhe quais lojas já leram.
          </p>
        </div>
        <Link className="btn" href="/admin/comunicados/novo">
          + Novo comunicado
        </Link>
      </div>

      {sp.ok && (
        <div className="banner" role="status" style={{ background: "var(--brand-soft)", color: "var(--brand-dark)", marginTop: 16 }}>
          <strong>
            {sp.ok === "agendado" ? "Comunicado agendado." : "Comunicado publicado."}{" "}
            {Number(sp.n) > 0 ? `Vai para ${sp.n} loja(s).` : "Vai para todas as lojas."} Acompanhe a ciência logo abaixo.
          </strong>
        </div>
      )}

      <div className="pills" role="group" aria-label="Filtrar por situação" style={{ margin: "16px 0" }}>
        {FILTROS.map((f) => (
          <Link key={f} href={`/admin/comunicados?f=${f}`} className={`pill${filtro === f ? " on" : ""}`} aria-current={filtro === f ? "true" : undefined} style={filtro === f ? { color: "#fff" } : undefined}>
            {NOMES[f]}
          </Link>
        ))}
      </div>

      {items.length === 0 && <p className="muted">Nenhum comunicado nesta lista.</p>}
      {items.map((a) => {
        const future = new Date(a.publish_at).getTime() > now;
        const ended = a.expires_at && new Date(a.expires_at).getTime() < now;
        const alvo = targetMap.get(a.id) ?? (stores ?? []).map((s) => s.id as string);
        const done = ackedStores.get(a.id) ?? new Set<string>();
        return (
          <article key={a.id} className="card">
            <div className="row" style={{ alignItems: "flex-start" }}>
              <div style={{ flex: "1 1 320px" }}>
                <strong style={{ fontSize: "1.05rem" }}>
                  <Link href={`/comunicados/${a.id}`} style={{ color: "inherit" }}>
                    {a.title}
                  </Link>
                </strong>
                <div className="muted">
                  {future ? `Agendado para ${formatDateTime(a.publish_at)}` : formatDateTime(a.publish_at)} ·{" "}
                  {targetMap.has(a.id) ? alvo.map((id) => storeName.get(id) ?? "—").join(", ") : "Todas as lojas"}
                  {a.expires_at ? ` · sai do ar em ${formatDateTime(a.expires_at)}` : ""}
                </div>
              </div>
              <span className={`badge ${future ? "blue" : ended ? "gray" : ""}`}>{future ? "Agendado" : ended ? "Encerrado" : "Publicado"}</span>
            </div>
            {a.requires_ack && (
              <div className="ciencia">
                <strong style={{ fontSize: ".8rem" }}>Ciência:</strong>
                {alvo.map((id) => (
                  <span key={id} className={done.has(id) ? "chip-ok" : "chip-pend"}>
                    {done.has(id) ? "✓" : "•"} {storeName.get(id) ?? "—"} · {done.has(id) ? "confirmou" : "pendente"}
                  </span>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </>
  );
}
