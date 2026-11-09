import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { signOut } from "../login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  return (
    <>
      <header className="top">
        <span className="logo">Portal Multimarcas</span>
        <nav>
          <Link href="/">Início</Link>
          <Link href="/comunicados">Comunicados</Link>
          <Link href="/arquivos">Arquivos</Link>
          {profile.role === "admin" && <Link href="/admin">Administração</Link>}
        </nav>
        <span>{profile.full_name}</span>
        <form action={signOut}>
          <button className="link" type="submit">
            Sair
          </button>
        </form>
      </header>
      <main>{children}</main>
    </>
  );
}
