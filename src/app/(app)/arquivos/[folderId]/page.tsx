import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatSize, UUID_RE } from "@/lib/format";
import {
  cleanRelativePath,
  DropboxError,
  getMetadata,
  isInside,
  listFolder,
  type DropboxEntry,
} from "@/lib/dropbox";

export default async function PastaPage({
  params,
  searchParams,
}: {
  params: Promise<{ folderId: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { folderId } = await params;
  const { p } = await searchParams;
  if (!UUID_RE.test(folderId)) notFound();

  const segments = cleanRelativePath(p);
  if (segments === null) notFound();

  await requireProfile();
  const supabase = await createClient();

  // RLS: se o usuario nao puder ver a pasta, nao volta nada.
  const { data: folder } = await supabase
    .from("library_folders")
    .select("id, name, dropbox_folder_id")
    .eq("id", folderId)
    .eq("active", true)
    .maybeSingle();
  if (!folder) notFound();

  let entries: DropboxEntry[] = [];
  let errorMessage: string | null = null;

  try {
    // A raiz e resolvida pelo ID a cada acesso: se mudarem/renomearem a pasta no Dropbox, continua funcionando.
    const root = await getMetadata(folder.dropbox_folder_id);
    if (root[".tag"] !== "folder") notFound();

    const targetPath = [root.path_display, ...segments].join("/");
    if (segments.length > 0) {
      const target = await getMetadata(targetPath);
      if (target[".tag"] !== "folder" || !isInside(root.path_lower, target.path_lower)) notFound();
    }
    entries = (await listFolder(targetPath)).filter((e) => isInside(root.path_lower, e.path_lower));
  } catch (e) {
    if (e instanceof DropboxError && e.notFound) notFound();
    console.error("Erro ao listar pasta do Dropbox", e);
    errorMessage = "Não foi possível carregar os arquivos agora. Tente novamente em instantes.";
  }

  const hrefFor = (segs: string[]) =>
    segs.length ? `/arquivos/${folderId}?p=${encodeURIComponent(segs.join("/"))}` : `/arquivos/${folderId}`;

  return (
    <>
      <p className="crumbs">
        <Link href="/arquivos">Arquivos</Link> / <Link href={hrefFor([])}>{folder.name}</Link>
        {segments.map((s, i) => (
          <span key={i}>
            {" / "}
            <Link href={hrefFor(segments.slice(0, i + 1))}>{s}</Link>
          </span>
        ))}
      </p>

      {errorMessage && <div className="error">{errorMessage}</div>}
      {!errorMessage && entries.length === 0 && <p className="muted">Pasta vazia.</p>}

      {entries.length > 0 && (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tamanho</th>
                <th>Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>
                    {e[".tag"] === "folder" ? (
                      <Link href={hrefFor([...segments, e.name])}>📁 {e.name}</Link>
                    ) : (
                      <a href={`/api/arquivos/download?folder=${folderId}&id=${encodeURIComponent(e.id)}`}>
                        📄 {e.name}
                      </a>
                    )}
                  </td>
                  <td className="muted">{formatSize(e.size)}</td>
                  <td className="muted">{formatDateTime(e.server_modified)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
