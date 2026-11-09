// Integracao SOMENTE LEITURA com o Dropbox. Executa apenas no servidor.
// Escopos do app Dropbox necessarios: files.metadata.read e files.content.read.
// Nenhuma funcao aqui escreve, move ou apaga arquivos.

const API = "https://api.dropboxapi.com/2";

export type DropboxEntry = {
  ".tag": "file" | "folder" | "deleted";
  id: string;
  name: string;
  path_lower: string;
  path_display: string;
  size?: number;
  server_modified?: string;
};

export class DropboxError extends Error {
  constructor(
    public status: number,
    public summary: string,
  ) {
    super(`Dropbox ${status}: ${summary}`);
  }
  get notFound() {
    return this.summary.startsWith("path/not_found") || this.summary.startsWith("path/not_file");
  }
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;

  const { DROPBOX_APP_KEY, DROPBOX_APP_SECRET, DROPBOX_REFRESH_TOKEN } = process.env;
  if (!DROPBOX_APP_KEY || !DROPBOX_APP_SECRET || !DROPBOX_REFRESH_TOKEN) {
    throw new Error("Dropbox nao configurado (DROPBOX_APP_KEY / APP_SECRET / REFRESH_TOKEN).");
  }

  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: DROPBOX_REFRESH_TOKEN,
      client_id: DROPBOX_APP_KEY,
      client_secret: DROPBOX_APP_SECRET,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new DropboxError(res.status, "falha ao renovar o token do Dropbox");

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

async function call<T>(endpoint: string, body: unknown): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${await accessToken()}`,
    "Content-Type": "application/json",
  };
  // Dropbox Business: acessar o espaco de equipe (team folders).
  if (process.env.DROPBOX_SELECT_USER) headers["Dropbox-API-Select-User"] = process.env.DROPBOX_SELECT_USER;
  if (process.env.DROPBOX_ROOT_NAMESPACE_ID) {
    headers["Dropbox-API-Path-Root"] = JSON.stringify({
      ".tag": "root",
      root: process.env.DROPBOX_ROOT_NAMESPACE_ID,
    });
  }

  const res = await fetch(`${API}/${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    let summary = res.statusText;
    try {
      const err = (await res.json()) as { error_summary?: string };
      summary = err.error_summary ?? summary;
    } catch {
      /* resposta nao-JSON */
    }
    throw new DropboxError(res.status, summary);
  }
  return (await res.json()) as T;
}

export function getMetadata(pathOrId: string): Promise<DropboxEntry> {
  return call<DropboxEntry>("files/get_metadata", { path: pathOrId });
}

export async function listFolder(path: string): Promise<DropboxEntry[]> {
  let result = await call<{ entries: DropboxEntry[]; cursor: string; has_more: boolean }>(
    "files/list_folder",
    { path, limit: 500 },
  );
  const entries = [...result.entries];
  while (result.has_more) {
    result = await call("files/list_folder/continue", { cursor: result.cursor });
    entries.push(...result.entries);
  }
  return entries
    .filter((e) => e[".tag"] !== "deleted")
    .sort((a, b) =>
      a[".tag"] === b[".tag"]
        ? a.name.localeCompare(b.name, "pt-BR", { numeric: true })
        : a[".tag"] === "folder"
          ? -1
          : 1,
    );
}

export async function getTemporaryLink(pathOrId: string): Promise<string> {
  const data = await call<{ link: string }>("files/get_temporary_link", { path: pathOrId });
  return data.link; // valido por ~4 horas
}

// ---------- Seguranca de caminhos ----------

/** Aceita apenas IDs do Dropbox (id:xxxx). Impede o uso de caminhos arbitrarios. */
export function isDropboxId(value: string): boolean {
  return /^id:[A-Za-z0-9_-]{1,64}$/.test(value);
}

/** Converte "a/b/c" em segmentos seguros. Retorna null se houver "..", "." ou caracteres de controle. */
export function cleanRelativePath(p: string | undefined): string[] | null {
  if (!p) return [];
  const segments = p.split("/").filter((s) => s.length > 0);
  for (const s of segments) {
    if (s === "." || s === ".." || s.includes("\\") || /[\u0000-\u001f]/.test(s)) return null;
  }
  return segments;
}

/** True se `candidate` for a propria raiz ou estiver dentro dela. Compara em minusculas (Dropbox ignora caixa). */
export function isInside(rootPathLower: string, candidatePathLower: string): boolean {
  return candidatePathLower === rootPathLower || candidatePathLower.startsWith(`${rootPathLower}/`);
}
