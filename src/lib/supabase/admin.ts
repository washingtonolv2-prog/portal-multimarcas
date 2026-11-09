import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente com a service role key: ignora o RLS. Use SOMENTE em server actions protegidas por requireAdmin()
// e apenas para o que o cliente comum nao pode fazer (criar usuarios e redefinir senhas no Supabase Auth).
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
