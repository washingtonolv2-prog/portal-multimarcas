import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { DEMO_FOLDERS, demoAnnouncements, isDemo } from "@/lib/demo";

function Mark({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export default async function BuscaPage({ searchParams }: { searchParams: Promise<{ q?: string; t?: string }> }) {
  await requireProfile();
  const { q: raw, t } = await searchParams;
  // Remove caracteres que têm significado no filtro do PostgREST.
  const q = (raw ?? "").replace(/[%,()*\\]/g, " ").trim().slice(0, 100);
  const tipo = t === "comunicados" || t === "arquivos" ? t : "tudo";
  const supabase = await createClient();

  const demo = await isDemo();
  const ql = q.toLowerCase();
  const [{ data: announcements }, { data: folders }] = demo
    ? [
        { data: q ? demoAnnouncements().filter((a) => `${a.title} ${a.summary} ${a.body}`.toLowerCase().includes(ql)) : [] },
        { data: q ? DEMO_FOLDERS.filter((f) => `${f.name} ${f.description}`.toLowerCase().includes(ql)) : [] },
      ]
    : q
    ? await Promise.all([
        supabase
          .from("announcements")
          .select("id, title, category, summary, publish_at")
          .or(`title.ilike.%${q}%,body.ilike.%${q}%,summary.ilike.%${q}%`)
          .order("publish_at", { ascending: false })
          .limit(20),
        supabase
          .from("library_folders")
          .select("id, name, description")
          .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
          .eq("active", true)
          .limit(20),
      ])
    : [{ data: [] }, { data: [] }];

  const nc = announcements?.length ?? 0;
  const na = folders?.length ?? 0;
  const total = nc + na;
  const tab = (key: string, label: string, n: number) => (
    <Link
      key={key}
      href={`/busca?q=${encodeURIComponent(q)}${key !== "tudo" ? `&t=${key}` : ""}`}
      className={`chip${tipo === key ? " on" : ""}`}
      aria-current={tipo === key ? "true" : undefined}
    >
      {label} · {n}
    </Link>
  );

  return (
    <div className="page-wide">
      <h1 aria-live="polite">
        {!q ? "Buscar no portal" : total === 0 ? `Nada encontrado para “${q}”` : `${total} resultado${total > 1 ? "s" : ""} para “${q}”`}
      </h1>
      {!q && <p className="muted">Digite um termo na caixa de busca acima.</p>}
      {q && total === 0 && <p className="muted">Confira a ortografia ou tente uma palavra mais simples.</p>}
      {total > 0 && (
        <nav aria-label="Filtrar resultados" className="chips">
          {tab("tudo", "Tudo", total)}
          {tab("comunicados", "Comunicados", nc)}
          {tab("arquivos", "Arquivos", na)}
        </nav>
      )}

      {nc > 0 && tipo !== "arquivos" && (
        <section aria-labelledby="h-com" className="card result-sec">
          <h2 id="h-com">Comunicados</h2>
          <ul>
            {announcements!.map((a) => (
              <li key={a.id}>
                <Link href={`/comunicados?id=${a.id}`} className="result">
                  <span className="muted">
                    {formatDate(a.publish_at)} · {a.category}
                  </span>
                  <strong>
                    <Mark text={a.title} q={q} />
                  </strong>
                  {a.summary && (
                    <span>
                      <Mark text={a.summary} q={q} />
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {na > 0 && tipo !== "comunicados" && (
        <section aria-labelledby="h-arq" className="card result-sec">
          <h2 id="h-arq">Arquivos</h2>
          <ul>
            {folders!.map((f) => (
              <li key={f.id}>
                <Link href={`/arquivos/${f.id}`} className="result">
                  <strong>
                    <Mark text={f.name} q={q} />
                  </strong>
                  {f.description && <span className="muted">{f.description}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
