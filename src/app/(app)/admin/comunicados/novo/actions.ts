"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/format";

// O formulario envia horario de Brasilia (America/Sao_Paulo, UTC-03:00, sem horario de verao desde 2019).
function toIso(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  if (!v) return null;
  const d = new Date(`${v}:00-03:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function createAnnouncement(formData: FormData) {
  const admin = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) redirect("/admin/comunicados/novo?erro=Preencha%20t%C3%ADtulo%20e%20mensagem.");

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("announcements")
    .insert({
      title,
      body,
      requires_ack: formData.get("requires_ack") === "on",
      publish_at: toIso(formData.get("publish_at")) ?? new Date().toISOString(),
      expires_at: toIso(formData.get("expires_at")),
      created_by: admin.id,
    })
    .select("id")
    .single();
  if (error || !created) redirect("/admin/comunicados/novo?erro=N%C3%A3o%20foi%20poss%C3%ADvel%20publicar.");

  const storeIds = formData.getAll("store_ids").map(String).filter((id) => UUID_RE.test(id));
  if (storeIds.length > 0) {
    await supabase
      .from("announcement_stores")
      .insert(storeIds.map((store_id) => ({ announcement_id: created.id, store_id })));
  }
  redirect("/admin/comunicados");
}
