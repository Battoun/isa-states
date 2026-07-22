import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import NavLinks from "@/components/NavLinks";

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
      <div className="relative mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4">
        <Link href="/dashboard" className="shrink-0 text-lg font-bold text-slate-50">
          🇺🇸 USA Plates
        </Link>
        <NavLinks
          username={profile?.username ?? ""}
          isAdmin={profile?.is_admin ?? false}
          signOutAction={signOut}
        />
      </div>
    </header>
  );
}
