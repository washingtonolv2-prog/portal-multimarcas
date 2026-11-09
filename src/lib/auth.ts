import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "supervisor" | "loja";
export type Profile = { id: string; full_name: string | null; role: Role; active: boolean };

// cache(): layout e pagina chamam isto na mesma requisicao, mas so consultamos uma vez.
export const requireProfile = cache(async (): Promise<Profile> => {
  const supabase = await createClient();
  // getClaims valida o token localmente quando possivel (sem ida ao servidor de autenticacao).
  const { data: claimsData } = await supabase.auth.getClaims();
  const uid = claimsData?.claims?.sub;
  if (!uid) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, active")
    .eq("id", uid)
    .single();

  if (!profile || !profile.active) {
    await supabase.auth.signOut();
    redirect("/login?erro=Acesso%20inativo.%20Fale%20com%20o%20administrador.");
  }
  return profile as Profile;
});

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/");
  return profile;
}
