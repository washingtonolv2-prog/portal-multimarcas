import { redirect, notFound } from "next/navigation";
import { UUID_RE } from "@/lib/format";

export default async function ComunicadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  redirect(`/comunicados?id=${id}`);
}
