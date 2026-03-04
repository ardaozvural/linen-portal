"use server"

import { supabase } from "@/lib/supabase"

export async function updateImageStatus(
  imageId: string,
  status: "approved" | "revision",
  clientNote?: string
) {
  const updates: { status: "approved" | "revision"; client_note?: string } = {
    status,
  }
  if (typeof clientNote === "string") {
    updates.client_note = clientNote
  }

  const { data, error } = await supabase
    .from("images")
    .update(updates)
    .eq("id", imageId)
    .select("id, status, client_note")
    .single()

  if (error) {
    console.error(error)
    throw new Error("Status update failed")
  }

  return data
}
