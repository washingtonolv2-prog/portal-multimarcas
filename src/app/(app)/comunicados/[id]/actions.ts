"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/format";

export async function confirmRead(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) return;

  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase
    .from("announcement_reads")
    .update({ acked_at: new Date().toISOString() })
    .eq("announcement_id", id)
    .eq("profile_id", profile.id)
    .is("acked_at", null);

  revalidatePath(`/comunicados/${id}`);
  revalidatePath("/");
}
