"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const ICONS: Record<string, string> = {
  home: "M4 11l8-7 8 7v9H4z",
  megaphone: "M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 9a4 4 0 0 1 0 6",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  edit: "M4 20h4L19 9l-4-4L4 16z",
  store: "M4 9l1-5h14l1 5M4 9v11h16V9M4 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 6 0 2.5 2.5 0 0 0 5 0",
  users: "M12 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM5 20a7 7 0 0 1 14 0",
  calendar: "M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM4 10h16M9 3v4M15 3v4",
  user: "M12 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM5 20a7 7 0 0 1 14 0",
  out: "M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9",
};

function Icon({ name }: { name: string }) {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]} />
    </svg>
  );
}

type Item = { href: string; label: string; icon: string; badge?: number };

export default function Sidebar({
  name,
  roleLabel,
  isAdmin,
  pending,
  signOut,
}: {
  name: string;
  roleLabel: string;
  isAdmin: boolean;
  pending: number;
  signOut: () => Promise<void>;
}) {
  const path = usePathname();
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    try {
      setClosed(localStorage.getItem("menu-fechado") === "1");
    } catch {}
  }, []);

  function toggle() {
    const next = !closed;
    setClosed(next);
    try {
      localStorage.setItem("menu-fechado", next ? "1" : "0");
    } catch {}
  }

  const main: Item[] = [
    { href: "/", label: "Início", icon: "home" },
    { href: "/comunicados", label: "Comunicados", icon: "megaphone", badge: pending },
    { href: "/arquivos", label: "Arquivos", icon: "folder" },
  ];
  const admin: Item[] = [
    { href: "/admin/comunicados", label: "Publicar comunicados", icon: "edit" },
    { href: "/admin/eventos", label: "Calendário", icon: "calendar" },
    { href: "/admin/pastas", label: "Pastas de arquivos", icon: "folder" },
    { href: "/admin/lojas", label: "Lojas", icon: "store" },
    { href: "/admin/usuarios", label: "Usuários", icon: "users" },
  ];

  function active(href: string) {
    if (href === "/") return path === "/";
    if (href === "/comunicados") return path === "/comunicados" || path.startsWith("/comunicados/");
    return path === href || path.startsWith(href + "/");
  }

  function link(i: Item) {
    return (
      <Link key={i.href} href={i.href} aria-current={active(i.href) ? "page" : undefined} aria-label={i.label} title={i.label}>
        <Icon name={i.icon} />
        <span className="nav-label">{i.label}</span>
        {i.badge ? <span className="dot-badge nav-label">{i.badge}</span> : null}
      </Link>
    );
  }

  return (
    <aside className={closed ? "side closed" : "side"}>
      <div className="side-head">
        <span className="logo">
          <span className="mark">PM</span>
          {!closed && "Portal Multimarcas"}
        </span>
        <button type="button" className="icon-btn" onClick={toggle} aria-label={closed ? "Mostrar menu" : "Ocultar menu"} title={closed ? "Mostrar menu" : "Ocultar menu"}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M9 4v16" />
            <path d={closed ? "M14 9.5l2.5 2.5-2.5 2.5" : "M17 9.5l-2.5 2.5 2.5 2.5"} />
          </svg>
        </button>
      </div>
      <nav className="nav" aria-label="Principal">
        {main.map(link)}
      </nav>
      {isAdmin && (
        <nav className="nav" aria-label="Administração">
          <span className="nav-title">Administração</span>
          {admin.map(link)}
        </nav>
      )}
      <div className="side-user">
        <Link href="/conta" className="avatar" aria-label="Minha conta" title="Minha conta" style={{ color: "inherit" }}>
          {name.slice(0, 1).toUpperCase()}
        </Link>
        <span className="user-info">
          <strong>{name}</strong>
          <span className="muted">{roleLabel}</span>
        </span>
        <form action={signOut}>
          <button type="submit" className="icon-btn" aria-label="Sair" title="Sair">
            <Icon name="out" />
          </button>
        </form>
      </div>
    </aside>
  );
}
