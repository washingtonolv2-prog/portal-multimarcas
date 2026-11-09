import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { roleLabel } from "@/lib/roles";
import Sidebar from "@/components/Sidebar";
import { signOut } from "../login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: needAck }, { data: acked }] = await Promise.all([
    supabase.from("announcements").select("id").eq("requires_ack", true),
    supabase.from("announcement_reads").select("announcement_id").eq("profile_id", profile.id).not("acked_at", "is", null),
  ]);
  const done = new Set((acked ?? []).map((r) => r.announcement_id as string));
  const pending = (needAck ?? []).filter((a) => !done.has(a.id as string)).length;

  return (
    <div className="shell">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Sidebar
        name={profile.full_name ?? "Usuário"}
        roleLabel={roleLabel(profile.role)}
        isAdmin={profile.role === "admin"}
        pending={pending}
        signOut={signOut}
      />
      <div className="content">
        <div className="topbar">
          <form className="search" action="/busca" role="search">
            <label className="sr-only" htmlFor="q">
              Buscar no portal
            </label>
            <input id="q" type="search" name="q" placeholder="Buscar comunicados e arquivos" maxLength={100} autoComplete="off" />
            <button className="btn" type="submit">
              Buscar
            </button>
          </form>
        </div>
        <main id="conteudo" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
