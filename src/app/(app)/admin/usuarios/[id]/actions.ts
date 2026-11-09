"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/format";
import { MIN_PASSWORD, parseRole } from "@/lib/roles";

const back = (id: string, kind: "erro" | "ok", msg: string) =>
  redirect(`/admin/usuarios/${id}?${kind}=${encodeURIComponent(msg)}`);

export async function saveUser(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) redirect("/admin/usuarios");

  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = parseRole(formData.get("role"));
  const active = formData.get("active") === "on";
  if (!fullName) back(id, "erro", "Informe o nome.");
  if (!role) back(id, "erro", "Perfil inválido.");

  // Evita o administrador se trancar para fora do portal.
  if (id === me.id && (role !== "admin" || !active)) {
    back(id, "erro", "Você não pode remover seu próprio acesso de administrador.");
  }

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, role, active })
    .eq("id", id)
    .select("id");
  if (error || !updated?.length) return back(id, "erro", "Não foi possível salvar.");

  const storeIds = formData.getAll("store_ids").map(String).filter((s) => UUID_RE.test(s));
  const { error: delError } = await supabase.from("profile_stores").delete().eq("profile_id", id);
  if (delError) return back(id, "erro", "Dados salvos, mas não foi possível atualizar as lojas.");
  if (storeIds.length > 0) {
    const { error: insError } = await supabase
      .from("profile_stores")
      .insert(storeIds.map((store_id) => ({ profile_id: id, store_id })));
    if (insError) return back(id, "erro", "Dados salvos, mas não foi possível atualizar as lojas.");
  }
  back(id, "ok", "Alterações salvas.");
}

export async function resetPassword(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) redirect("/admin/usuarios");

  const password = String(formData.get("password") ?? "");
  if (password.length < MIN_PASSWORD) back(id, "erro", `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`);

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(id, { password });
    if (error) return back(id, "erro", "Não foi possível redefinir a senha.");
  } catch (e) {
    console.error("Erro ao redefinir senha", e);
    return back(id, "erro", "Não foi possível redefinir a senha. Confira a SUPABASE_SERVICE_ROLE_KEY no servidor.");
  }
  back(id, "ok", "Senha redefinida. Informe a nova senha à pessoa por um canal seguro.");
}
