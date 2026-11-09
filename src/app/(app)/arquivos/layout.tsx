import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import FolderNav from "@/components/FolderNav";
import { DEMO_FOLDERS, isDemo } from "@/lib/demo";

export default async function ArquivosLayout({ children }: { children: React.ReactNode }) {
  await requireProfile();
  const supabase = await createClient();
  // RLS devolve apenas as pastas liberadas para as lojas deste usuario.
  const { data: dbFolders } = await supabase
    .from("library_folders")
    .select("id, name")
    .eq("active", true)
    .order("sort_order")
    .order("name");

  const folders = (await isDemo()) ? DEMO_FOLDERS : dbFolders;
  return (
    <div className="page-wide">
      <h1>Arquivos</h1>
      <p className="muted">Os arquivos vêm direto do Dropbox da empresa. Você só vê as pastas liberadas para a sua loja.</p>
      <div className="split files">
        <div className="split-list">
          {(folders ?? []).length === 0 ? <p className="muted">Nenhuma pasta disponível.</p> : <FolderNav folders={folders ?? []} />}
        </div>
        <section className="split-detail" aria-label="Conteúdo da pasta">
          {children}
        </section>
      </div>
    </div>
  );
}
