import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminPage() {
  await requireAdmin();
  return (
    <>
      <h1>Administração</h1>
      <div className="list">
        <Link href="/admin/comunicados" className="card item">
          <strong>Comunicados</strong>
          <div className="muted">Publicar e acompanhar leituras e confirmações</div>
        </Link>
        <Link href="/admin/pastas" className="card item">
          <strong>Pastas de arquivos</strong>
          <div className="muted">Ligar pastas do Dropbox ao portal e escolher quais lojas veem cada uma</div>
        </Link>
        <Link href="/admin/lojas" className="card item">
          <strong>Lojas</strong>
          <div className="muted">Cadastrar lojas</div>
        </Link>
      </div>
    </>
  );
}
