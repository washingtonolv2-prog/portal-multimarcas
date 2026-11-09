import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

type Announcement = {
  id: string;
  title: string;
  requires_ack: boolean;
  publish_at: string;
};

export default async function HomePage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: announcements }, { data: reads }] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, requires_ack, publish_at")
      .order("publish_at", { ascending: false })
      .limit(30),
    supabase.from("announcement_reads").select("announcement_id, acked_at").eq("profile_id", profile.id),
  ]);

  const readMap = new Map((reads ?? []).map((r) => [r.announcement_id as string, r.acked_at as string | null]));
  const list = (announcements ?? []) as Announcement[];
  const pending = list.filter((a) => a.requires_ack && !readMap.get(a.id));
  const unread = list.filter((a) => !readMap.has(a.id) && !a.requires_ack);

  return (
    <>
      <h1>Olá, {profile.full_name?.split(" ")[0] ?? "bem-vindo"}</h1>

      <h2>Precisam da sua confirmação</h2>
      {pending.length === 0 ? (
        <p className="muted">Nada pendente.</p>
      ) : (
        <div className="list">
          {pending.map((a) => (
            <Link key={a.id} href={`/comunicados/${a.id}`} className="card item">
              <div className="row">
                <strong>{a.title}</strong>
                <span className="badge warn">Confirmar leitura</span>
              </div>
              <div className="muted">{formatDate(a.publish_at)}</div>
            </Link>
          ))}
        </div>
      )}

      <h2>Novos comunicados</h2>
      {unread.length === 0 ? (
        <p className="muted">Você está em dia.</p>
      ) : (
        <div className="list">
          {unread.slice(0, 8).map((a) => (
            <Link key={a.id} href={`/comunicados/${a.id}`} className="card item">
              <div className="row">
                <strong>{a.title}</strong>
                <span className="badge">Novo</span>
              </div>
              <div className="muted">{formatDate(a.publish_at)}</div>
            </Link>
          ))}
        </div>
      )}

      <p>
        <Link href="/comunicados">Ver todos os comunicados</Link> · <Link href="/arquivos">Abrir arquivos</Link>
      </p>
    </>
  );
}
