import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";

export default async function AdminComunicadosPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: announcements }, { data: reads }, { count: totalUsers }] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, requires_ack, publish_at, expires_at")
      .order("publish_at", { ascending: false })
      .limit(100),
    supabase.from("announcement_reads").select("announcement_id, acked_at"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("active", true),
  ]);

  const stats = new Map<string, { read: number; acked: number }>();
  for (const r of reads ?? []) {
    const s = stats.get(r.announcement_id) ?? { read: 0, acked: 0 };
    s.read += 1;
    if (r.acked_at) s.acked += 1;
    stats.set(r.announcement_id, s);
  }

  return (
    <>
      <div className="row">
        <h1>Comunicados</h1>
        <Link className="btn" href="/admin/comunicados/novo">
          Novo comunicado
        </Link>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Publicado</th>
              <th>Lidos</th>
              <th>Confirmados</th>
            </tr>
          </thead>
          <tbody>
            {(announcements ?? []).map((a) => {
              const s = stats.get(a.id) ?? { read: 0, acked: 0 };
              return (
                <tr key={a.id}>
                  <td>
                    <Link href={`/comunicados/${a.id}`}>{a.title}</Link>
                  </td>
                  <td className="muted">{formatDateTime(a.publish_at)}</td>
                  <td>
                    {s.read}/{totalUsers ?? "?"}
                  </td>
                  <td>{a.requires_ack ? `${s.acked}/${totalUsers ?? "?"}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
