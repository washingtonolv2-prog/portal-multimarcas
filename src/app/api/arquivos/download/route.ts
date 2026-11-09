import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/format";
import { DropboxError, getMetadata, getTemporaryLink, isDropboxId, isInside } from "@/lib/dropbox";

// Download: valida login e permissao, confere que o arquivo esta dentro da pasta liberada
// e redireciona para um link temporario do Dropbox. O arquivo nunca passa pelo Supabase.
export async function GET(request: NextRequest) {
  const folderId = request.nextUrl.searchParams.get("folder") ?? "";
  const fileId = request.nextUrl.searchParams.get("id") ?? "";
  if (!UUID_RE.test(folderId) || !isDropboxId(fileId)) {
    return new NextResponse("Requisição inválida", { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Não autenticado", { status: 401 });

  // RLS: so retorna a pasta se este usuario tiver acesso.
  const { data: folder } = await supabase
    .from("library_folders")
    .select("id, dropbox_folder_id")
    .eq("id", folderId)
    .eq("active", true)
    .maybeSingle();
  if (!folder) return new NextResponse("Não encontrado", { status: 404 });

  try {
    const [root, file] = await Promise.all([getMetadata(folder.dropbox_folder_id), getMetadata(fileId)]);
    if (root[".tag"] !== "folder" || file[".tag"] !== "file" || !isInside(root.path_lower, file.path_lower)) {
      return new NextResponse("Não encontrado", { status: 404 });
    }

    const link = await getTemporaryLink(file.id);

    // Registro de auditoria (falha aqui nao deve impedir o download).
    await supabase.from("download_log").insert({
      profile_id: user.id,
      folder_id: folder.id,
      dropbox_file_id: file.id,
      file_name: file.name,
    });

    const res = NextResponse.redirect(link, 302);
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    if (e instanceof DropboxError && e.notFound) return new NextResponse("Não encontrado", { status: 404 });
    console.error("Erro no download do Dropbox", e);
    return new NextResponse("Erro ao gerar o download", { status: 502 });
  }
}
