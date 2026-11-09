import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export default async function ComunicadosPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: announcements }, { data: reads }] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, requires_ack, publish_at")
      .order("publish_at", { ascending: false })
      .limit(200),
    supabase.from("announcement_reads").select("announcement_id, acked_at").eq("profile_id", profile.id),
  ]);
  const readMap = new Map((reads ?? []).map((r) => [r.announcement_id as string, r.acked_at as string | null]));

  return (
    <>
      <h1>Comunicados</h1>
      {(announcements ?? []).length === 0 && <p className="muted">Nenhum comunicado.</p>}
      <div className="list">
        {(announcements ?? []).map((a) => {
          const read = readMap.has(a.id);
          const acked = !!readMap.get(a.id);
          return (
            <Link key={a.id} href={`/comunicados/${a.id}`} className="card item">
              <div className="row">
                <strong>{a.title}</strong>
                {a.requires_ack && !acked ? (
                  <span className="badge warn">Confirmar leitura</span>
                ) : !read ? (
                  <span className="badge">Novo</span>
                ) : null}
              </div>
              <div className="muted">{formatDate(a.publish_at)}</div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
