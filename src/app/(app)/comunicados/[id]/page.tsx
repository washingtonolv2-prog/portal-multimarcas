import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, UUID_RE } from "@/lib/format";
import { confirmRead } from "./actions";

export default async function ComunicadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const profile = await requireProfile();
  const supabase = await createClient();

  // RLS garante que so comunicados permitidos para este usuario sejam retornados.
  const { data: a } = await supabase
    .from("announcements")
    .select("id, title, body, requires_ack, publish_at")
    .eq("id", id)
    .maybeSingle();
  if (!a) notFound();

  // Marca como lido (ignora se ja existir).
  await supabase
    .from("announcement_reads")
    .upsert({ announcement_id: id, profile_id: profile.id }, { onConflict: "announcement_id,profile_id", ignoreDuplicates: true });

  const { data: read } = await supabase
    .from("announcement_reads")
    .select("acked_at")
    .eq("announcement_id", id)
    .eq("profile_id", profile.id)
    .maybeSingle();

  return (
    <>
      <p className="crumbs">
        <Link href="/comunicados">← Comunicados</Link>
      </p>
      <h1>{a.title}</h1>
      <p className="muted">Publicado em {formatDateTime(a.publish_at)}</p>
      {/* Texto puro: nunca renderizamos HTML vindo do banco. */}
      <div className="card body-text">{a.body}</div>

      {a.requires_ack &&
        (read?.acked_at ? (
          <p>
            <span className="badge">Leitura confirmada em {formatDateTime(read.acked_at)}</span>
          </p>
        ) : (
          <form action={confirmRead}>
            <input type="hidden" name="id" value={a.id} />
            <button className="btn" type="submit">
              Confirmar que li
            </button>
          </form>
        ))}
    </>
  );
}
