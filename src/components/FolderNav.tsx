"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FolderNav({ folders }: { folders: { id: string; name: string }[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Pastas de arquivos" className="folder-nav">
      <ul>
        {folders.map((f) => {
          const on = path.startsWith(`/arquivos/${f.id}`);
          return (
            <li key={f.id}>
              <Link href={`/arquivos/${f.id}`} aria-current={on ? "page" : undefined} className={on ? "on" : undefined}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
                {f.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
