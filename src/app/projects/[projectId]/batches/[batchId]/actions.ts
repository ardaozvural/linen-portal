"use server"

import { supabase } from "@/lib/supabase"

export async function updateImageStatus(
  imageId: string,
  status: "approve" | "revise"
) {
  const { error } = await supabase
    .from("images")
    .update({ status })
    .eq("id", imageId)

  if (error) {
    console.error(error)
    throw new Error("Status update failed")
  }
}
