"use client";

import { useActionState } from "react";
import { signIn, type AuthFormState } from "@/app/auth/actions";

const initialState: AuthFormState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-slate-200">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
          placeholder="toi@example.com"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-slate-200">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
          placeholder="••••••••"
        />
      </div>
      {state.error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-sky-500 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
      >
        {pending ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
