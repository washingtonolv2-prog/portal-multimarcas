"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/format";

export async function createEvent(formData: FormData) {
  const admin = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const kind = ["evento", "prazo", "feriado"].includes(String(formData.get("kind"))) ? String(formData.get("kind")) : "evento";
  const date = String(formData.get("starts_on") ?? "");
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect("/admin/eventos?erro=Informe%20o%20t%C3%ADtulo%20e%20a%20data.");
  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({ title, starts_on: date, kind, created_by: admin.id });
  if (error) redirect("/admin/eventos?erro=N%C3%A3o%20foi%20poss%C3%ADvel%20salvar%20o%20evento.");
  revalidatePath("/");
  redirect("/admin/eventos");
}

export async function deleteEvent(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) return;
  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin/eventos");
}
