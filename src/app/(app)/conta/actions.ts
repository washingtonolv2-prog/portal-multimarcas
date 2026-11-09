"use server";

import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MIN_PASSWORD } from "@/lib/roles";

const back = (kind: "erro" | "ok", msg: string) => redirect(`/conta?${kind}=${encodeURIComponent(msg)}`);

export async function changePassword(formData: FormData) {
  await requireProfile();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < MIN_PASSWORD) back("erro", `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`);
  if (password !== confirm) back("erro", "As senhas não conferem.");

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return back("erro", "Não foi possível trocar a senha. Tente novamente.");
  back("ok", "Senha alterada.");
}
