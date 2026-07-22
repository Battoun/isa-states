import Link from "next/link";
import SignupForm from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl sm:p-8">
        <h1 className="text-2xl font-bold text-slate-50">Créer un compte</h1>
        <p className="mt-1 text-sm text-slate-400">
          Rejoins le roadtrip et commence ta collection de plaques.
        </p>
        <div className="mt-6">
          <SignupForm />
        </div>
        <p className="mt-6 text-center text-sm text-slate-400">
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-medium text-sky-400 hover:text-sky-300">
            Connecte-toi
          </Link>
        </p>
      </div>
    </div>
  );
}
