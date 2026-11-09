"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createStore(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const brand = String(formData.get("brand") ?? "").trim() || null;
  const state = String(formData.get("state") ?? "").trim().toUpperCase() || null;

  const supabase = await createClient();
  await supabase.from("stores").insert({ name, brand, state });
  revalidatePath("/admin/lojas");
}
