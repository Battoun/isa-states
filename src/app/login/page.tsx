import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl sm:p-8">
        <h1 className="text-2xl font-bold text-slate-50">Connexion</h1>
        <p className="mt-1 text-sm text-slate-400">
          Reprends la chasse aux plaques là où tu l&apos;as laissée.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-slate-400">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-medium text-sky-400 hover:text-sky-300">
            Inscris-toi
          </Link>
        </p>
      </div>
    </div>
  );
}
