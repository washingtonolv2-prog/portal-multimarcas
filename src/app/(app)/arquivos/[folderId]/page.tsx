import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatSize, UUID_RE } from "@/lib/format";
import { DEMO_FOLDERS, demoFiles, isDemo } from "@/lib/demo";
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
  searchParams: Promise<{ p?: string; q?: string }>;
}) {
  const { folderId } = await params;
  const { p, q: rawQ } = await searchParams;
  const q = (rawQ ?? "").trim().slice(0, 100).toLowerCase();
  if (!UUID_RE.test(folderId)) notFound();

  const segments = cleanRelativePath(p);
  if (segments === null) notFound();

  await requireProfile();
  const supabase = await createClient();

  const demo = await isDemo();
  // RLS: se o usuario nao puder ver a pasta, nao volta nada.
  const { data: dbFolder } = demo
    ? { data: null }
    : await supabase
        .from("library_folders")
        .select("id, name, dropbox_folder_id")
        .eq("id", folderId)
        .eq("active", true)
        .maybeSingle();
  const demoFolder = demo ? DEMO_FOLDERS.find((f) => f.id === folderId) : undefined;
  const folder = demoFolder ? { id: demoFolder.id, name: demoFolder.name, dropbox_folder_id: "" } : dbFolder;
  if (!folder) notFound();

  let entries: DropboxEntry[] = [];
  let errorMessage: string | null = null;

  if (demo) {
    entries = demoFiles(folderId) as unknown as DropboxEntry[];
  } else try {
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

  const shown = q ? entries.filter((e) => e.name.toLowerCase().includes(q)) : entries;
  const ext = (n: string) => (n.includes(".") ? n.split(".").pop()!.slice(0, 4).toUpperCase() : "ARQ");
  const hrefFor = (segs: string[]) =>
    segs.length ? `/arquivos/${folderId}?p=${encodeURIComponent(segs.join("/"))}` : `/arquivos/${folderId}`;

  return (
    <>
      <nav aria-label="Caminho" className="crumbs">
        <Link href="/arquivos">Arquivos</Link> / <Link href={hrefFor([])}>{folder.name}</Link>
        {segments.map((s, i) => (
          <span key={i}>
            {" / "}
            <Link href={hrefFor(segments.slice(0, i + 1))} aria-current={i === segments.length - 1 ? "page" : undefined}>
              {s}
            </Link>
          </span>
        ))}
      </nav>
      <div className="row">
        <h2 className="art-title">{segments.length ? segments[segments.length - 1] : folder.name}</h2>
        <form role="search" className="folder-search" action={`/arquivos/${folderId}`}>
          {segments.length > 0 && <input type="hidden" name="p" value={segments.join("/")} />}
          <label className="sr-only" htmlFor="fq">Buscar nesta pasta</label>
          <input id="fq" type="search" name="q" defaultValue={rawQ ?? ""} placeholder="Buscar nesta pasta" maxLength={100} />
        </form>
      </div>

      {errorMessage && <div className="error" role="alert">{errorMessage}</div>}
      {!errorMessage && entries.length === 0 && <p className="muted">Pasta vazia.</p>}
      {!errorMessage && entries.length > 0 && shown.length === 0 && (
        <p className="muted" role="status">Nenhum arquivo com “{q}” nesta pasta.</p>
      )}

      {shown.length > 0 && (
        <ul className="file-rows">
          {shown.map((e) => {
            const isFolder = e[".tag"] === "folder";
            return (
              <li key={e.id} className="file-row">
                <span className={`type-badge${isFolder ? " folder" : ""}`} aria-hidden="true">
                  {isFolder ? "PASTA" : ext(e.name)}
                </span>
                <span className="file-info">
                  <strong>{e.name}</strong>
                  {!isFolder && (
                    <span className="muted">
                      Atualizado {formatDateTime(e.server_modified)}
                      {e.size !== undefined ? ` · ${formatSize(e.size)}` : ""}
                    </span>
                  )}
                </span>
                {isFolder ? (
                  <Link className="btn secondary small" href={hrefFor([...segments, e.name])} aria-label={`Abrir pasta ${e.name}`}>
                    Abrir
                  </Link>
                ) : (
                  <a
                    className="btn soft small"
                    href={demo ? "#" : `/api/arquivos/download?folder=${folderId}&id=${encodeURIComponent(e.id)}`}
                    aria-label={`Baixar ${e.name}`}
                  >
                    Baixar
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
