"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/format";
import { DropboxError, getMetadata } from "@/lib/dropbox";

const back = (msg: string) => redirect(`/admin/pastas?erro=${encodeURIComponent(msg)}`);

export async function createFolder(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  let path = String(formData.get("dropbox_path") ?? "").trim();
  if (!name || !path) back("Preencha o nome e o caminho da pasta.");
  if (!path.startsWith("/")) path = `/${path}`;

  // Resolve o caminho para o ID do Dropbox: o portal guarda so o ID, entao mover/renomear nao quebra.
  let folderId: string;
  try {
    const meta = await getMetadata(path);
    if (meta[".tag"] !== "folder") return back("O caminho informado não é uma pasta.");
    folderId = meta.id;
  } catch (e) {
    if (e instanceof DropboxError && e.notFound) return back("Pasta não encontrada no Dropbox.");
    console.error("Erro ao consultar o Dropbox", e);
    return back("Não foi possível consultar o Dropbox. Confira as chaves do servidor.");
  }

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("library_folders")
    .insert({ name, description, dropbox_folder_id: folderId })
    .select("id")
    .single();
  if (error || !created) return back("Não foi possível salvar a pasta.");

  const storeIds = formData.getAll("store_ids").map(String).filter((id) => UUID_RE.test(id));
  if (storeIds.length > 0) {
    await supabase
      .from("library_folder_stores")
      .insert(storeIds.map((store_id) => ({ folder_id: created.id, store_id })));
  }
  redirect("/admin/pastas?ok=1");
}
