"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function reviewPlate(plateId: string, status: "approved" | "rejected") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("plates")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", plateId);

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
}
