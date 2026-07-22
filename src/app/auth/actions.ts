"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthFormState {
  error?: string;
  message?: string;
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Merci de renseigner ton email et ton mot de passe." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email ou mot de passe incorrect." };
  }

  redirect("/dashboard");
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "").trim();

  if (!email || !password || !username) {
    return { error: "Merci de remplir tous les champs." };
  }
  if (password.length < 6) {
    return { error: "Le mot de passe doit faire au moins 6 caractères." };
  }
  if (!/^[a-zA-Z0-9_-]{2,20}$/.test(username)) {
    return {
      error:
        "Le pseudo doit faire entre 2 et 20 caractères (lettres, chiffres, - ou _).",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    message:
      "Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse avant de te connecter.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
