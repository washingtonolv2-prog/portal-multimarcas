import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export default async function BuscaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireProfile();
  const { q: raw } = await searchParams;
  // Remove caracteres que têm significado no filtro do PostgREST.
  const q = (raw ?? "").replace(/[%,()*\\]/g, " ").trim().slice(0, 100);
  const supabase = await createClient();

  const [{ data: announcements }, { data: folders }] = q
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

  const total = (announcements?.length ?? 0) + (folders?.length ?? 0);

  return (
    <>
      <h1>Resultados da busca</h1>
      {!q ? (
        <p className="muted">Digite um termo na caixa de busca acima.</p>
      ) : (
        <p className="muted">
          {total === 0 ? `Nada encontrado para “${q}”. Tente outra palavra.` : `${total} resultado(s) para “${q}”`}
        </p>
      )}

      {(announcements?.length ?? 0) > 0 && (
        <>
          <h2>Comunicados</h2>
          <div className="list">
            {announcements!.map((a) => (
              <Link key={a.id} href={`/comunicados/${a.id}`} className="card item">
                <strong>{a.title}</strong>
                <div className="muted">
                  {a.category} · {formatDate(a.publish_at)}
                </div>
                {a.summary && <div>{a.summary}</div>}
              </Link>
            ))}
          </div>
        </>
      )}

      {(folders?.length ?? 0) > 0 && (
        <>
          <h2>Pastas de arquivos</h2>
          <div className="list">
            {folders!.map((f) => (
              <Link key={f.id} href={`/arquivos/${f.id}`} className="card item">
                <strong>{f.name}</strong>
                {f.description && <div className="muted">{f.description}</div>}
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
