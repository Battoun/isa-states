import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold text-slate-50">
            🇺🇸 USA Plates
          </Link>
        </div>
      </header>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, is_admin")
    .eq("id", user.id)
    .single();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4">
        <Link href="/dashboard" className="shrink-0 text-lg font-bold text-slate-50">
          🇺🇸 USA Plates
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto text-sm font-medium sm:gap-2">
          <Link
            href="/dashboard"
            className="rounded-lg px-2.5 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-slate-50 sm:px-3"
          >
            Ma collection
          </Link>
          <Link
            href="/leaderboard"
            className="rounded-lg px-2.5 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-slate-50 sm:px-3"
          >
            Classement
          </Link>
          {profile?.is_admin && (
            <Link
              href="/admin"
              className="rounded-lg px-2.5 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-slate-50 sm:px-3"
            >
              Admin
            </Link>
          )}
          <span className="ml-1 hidden shrink-0 text-slate-500 sm:inline">
            {profile?.username}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="shrink-0 rounded-lg px-2.5 py-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-50 sm:px-3"
            >
              Déconnexion
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
