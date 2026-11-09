import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ArquivosPage() {
  await requireProfile();
  const supabase = await createClient();

  // RLS devolve apenas as pastas liberadas para as lojas deste usuario.
  const { data: folders } = await supabase
    .from("library_folders")
    .select("id, name, description")
    .eq("active", true)
    .order("sort_order")
    .order("name");

  return (
    <>
      <h1>Arquivos</h1>
      {(folders ?? []).length === 0 && <p className="muted">Nenhuma pasta disponível.</p>}
      <div className="list">
        {(folders ?? []).map((f) => (
          <Link key={f.id} href={`/arquivos/${f.id}`} className="card item">
            <strong>📁 {f.name}</strong>
            {f.description && <div className="muted">{f.description}</div>}
          </Link>
        ))}
      </div>
    </>
  );
}
