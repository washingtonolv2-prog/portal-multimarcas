"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/format";
import { EMAIL_RE, MIN_PASSWORD, parseRole } from "@/lib/roles";

const back = (msg: string) => redirect(`/admin/usuarios/novo?erro=${encodeURIComponent(msg)}`);

export async function createUser(formData: FormData) {
  await requireAdmin();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = parseRole(formData.get("role"));

  if (!fullName) back("Informe o nome.");
  if (!EMAIL_RE.test(email)) back("E-mail inválido.");
  if (password.length < MIN_PASSWORD) back(`A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`);
  if (!role) back("Perfil inválido.");

  let userId: string;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error || !data.user) {
      const exists = /already|registered|exists/i.test(error?.message ?? "");
      return back(exists ? "Já existe um usuário com esse e-mail." : "Não foi possível criar o usuário.");
    }
    userId = data.user.id;
  } catch (e) {
    console.error("Erro ao criar usuario", e);
    return back("Não foi possível criar o usuário. Confira a SUPABASE_SERVICE_ROLE_KEY no servidor.");
  }

  // O trigger ja criou o perfil (perfil Loja). Ajusta o perfil e as lojas com o cliente comum (RLS de admin).
  const supabase = await createClient();
  const { error: roleError } = await supabase.from("profiles").update({ role, full_name: fullName }).eq("id", userId);
  if (roleError) {
    return redirect(`/admin/usuarios/${userId}?erro=${encodeURIComponent("Usuário criado, mas não foi possível definir o perfil. Ajuste abaixo.")}`);
  }

  const storeIds = formData.getAll("store_ids").map(String).filter((id) => UUID_RE.test(id));
  if (storeIds.length > 0) {
    await supabase.from("profile_stores").insert(storeIds.map((store_id) => ({ profile_id: userId, store_id })));
  }
  redirect(`/admin/usuarios/${userId}?ok=${encodeURIComponent("Usuário criado.")}`);
}
