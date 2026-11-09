import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAnnouncement } from "./actions";
import PublishForm from "./PublishForm";

export default async function NovoComunicadoPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  await requireAdmin();
  const { erro } = await searchParams;
  const supabase = await createClient();
  const { data: stores } = await supabase.from("stores").select("id, name").eq("active", true).order("name");
  const minNow = new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).slice(0, 16).replace(" ", "T");

  return (
    <>
      <p className="crumbs">
        <Link href="/admin/comunicados">Comunicados</Link> / Novo
      </p>
      <h1>Publicar comunicado</h1>
      <PublishForm stores={stores ?? []} minNow={minNow} action={createAnnouncement} initialError={erro} />
    </>
  );
}
