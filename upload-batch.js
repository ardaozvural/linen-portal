import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

// --- SAFETY GUARDS (auto-added) ---
if (!process.env.BATCH_ID || !String(process.env.BATCH_ID).match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
  console.error("❌ BATCH_ID (uuid) required. Copy batch URL and set BATCH_ID.");
  process.exit(1);
}
if (!process.env.BEFORE_DIR || !process.env.AFTER_DIR) {
  console.error("❌ BEFORE_DIR and AFTER_DIR required.");
  process.exit(1);
}
// --- /SAFETY GUARDS ---
import fs from "fs"
import path from "path"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BATCH_ID = process.env.BATCH_ID
const BEFORE_DIR = process.env.BEFORE_DIR
const AFTER_DIR = process.env.AFTER_DIR

async function run() {
  const beforeFiles = fs.readdirSync(BEFORE_DIR)

  for (const file of beforeFiles) {
    const base = path.parse(file).name
    const beforePath = path.join(BEFORE_DIR, file)
    const afterPath = path.join(AFTER_DIR, base + ".png")

    if (!fs.existsSync(afterPath)) {
      console.log("SKIP (after not found):", base)
      continue
    }

    const beforeBuffer = fs.readFileSync(beforePath)
    const afterBuffer = fs.readFileSync(afterPath)

    const beforeKey = `${BATCH_ID}/${file}`
    const afterKey = `${BATCH_ID}/${base}.png`

    // upload before
    const { error: beforeErr } = await supabase.storage
      .from("before")
      .upload(beforeKey, beforeBuffer, { upsert: true })

    if (beforeErr) {
      console.log("Before upload error:", beforeErr.message)
      continue
    }

    // upload after
    const { error: afterErr } = await supabase.storage
      .from("after")
      .upload(afterKey, afterBuffer, { upsert: true })

    if (afterErr) {
      console.log("After upload error:", afterErr.message)
      continue
    }

    const beforeUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/before/${beforeKey}`
    const afterUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/after/${afterKey}`

const { error: dbErr } = await supabase
  .from("images")
  .upsert(
    {
      batch_id: BATCH_ID,
      filename: base,
      before_url: beforeUrl,
      after_url: afterUrl,
      status: "pending",
    },
    { onConflict: "batch_id,filename" }
  )
    if (dbErr) {
      console.log("DB insert error:", dbErr.message)
      continue
    }

    console.log("UPLOADED:", base)
  }

  console.log("DONE")
}

run()
