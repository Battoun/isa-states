"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavLink {
  href: string;
  label: string;
}

export default function NavLinks({
  username,
  isAdmin,
  signOutAction,
}: {
  username: string;
  isAdmin: boolean;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links: NavLink[] = [
    { href: "/dashboard", label: "Ma collection" },
    { href: "/leaderboard", label: "Classement" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const linkClass = (href: string) =>
    `rounded-lg px-3 py-2 transition ${
      pathname === href
        ? "bg-sky-500/15 text-sky-400"
        : "text-slate-300 hover:bg-slate-800 hover:text-slate-50"
    }`;

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden items-center gap-1 text-sm font-medium sm:flex">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={linkClass(link.href)}>
            {link.label}
          </Link>
        ))}
        <span className="ml-1 shrink-0 text-slate-500">{username}</span>
        <form action={signOutAction}>
          <button
            type="submit"
            className="shrink-0 rounded-lg px-3 py-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-50"
          >
            Déconnexion
          </button>
        </form>
      </nav>

      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-200 transition hover:bg-slate-800 sm:hidden"
      >
        <span className="text-xl leading-none">{open ? "✕" : "☰"}</span>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 z-30 border-b border-slate-800 bg-slate-950/95 shadow-xl backdrop-blur sm:hidden">
          <div className="flex flex-col gap-1 px-4 py-3">
            <span className="px-3 py-1 text-xs font-medium text-slate-500">
              Connecté en tant que {username}
            </span>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={linkClass(link.href)}
              >
                {link.label}
              </Link>
            ))}
            <form action={signOutAction}>
              <button
                type="submit"
                onClick={() => setOpen(false)}
                className="w-full rounded-lg px-3 py-2 text-left text-slate-400 transition hover:bg-slate-800 hover:text-slate-50"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
