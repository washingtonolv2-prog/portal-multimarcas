import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { roleLabel } from "@/lib/roles";
import Sidebar from "@/components/Sidebar";
import { signOut } from "../login/actions";
import { toggleDemo } from "../demo-actions";
import "../demo.css";
import { demoAcked, demoAnnouncements, isDemo } from "@/lib/demo";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const demo = await isDemo();

  const [{ data: needAck }, { data: acked }] = await Promise.all([
    supabase.from("announcements").select("id").eq("requires_ack", true),
    supabase.from("announcement_reads").select("announcement_id").eq("profile_id", profile.id).not("acked_at", "is", null),
  ]);
  const done = new Set((acked ?? []).map((r) => r.announcement_id as string));
  let pending = (needAck ?? []).filter((a) => !done.has(a.id as string)).length;
  if (demo) {
    const dAck = await demoAcked();
    pending = demoAnnouncements().filter((a) => a.requires_ack && !dAck.has(a.id)).length;
  }
  const isAdmin = profile.role === "admin";

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
        {demo && (
          <div className="demo-banner" role="status">
            <strong>Modo demonstração</strong>
            <span>Os dados abaixo são fictícios e nada é salvo no banco.</span>
            {isAdmin && (
              <form action={toggleDemo}>
                <button type="submit">Sair da demonstração</button>
              </form>
            )}
          </div>
        )}
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
          {isAdmin && !demo && (
            <form action={toggleDemo}>
              <button className="btn secondary" type="submit">
                Modo demonstração
              </button>
            </form>
          )}
        </div>
        <main id="conteudo" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
