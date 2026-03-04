import { createClient, type SupabaseClient } from "@supabase/supabase-js"

function requirePublicEnv() {
  // Next.js client-side inlining works reliably with dot notation.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) throw new Error("Supabase env eksik: NEXT_PUBLIC_SUPABASE_URL")
  if (!anon) throw new Error("Supabase env eksik: NEXT_PUBLIC_SUPABASE_ANON_KEY")

  return { url, anon }
}

const { url: supabaseUrl, anon: supabaseAnonKey } = requirePublicEnv()

let browserClient: SupabaseClient | null = null

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return browserClient
}

export function getSupabaseServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

export const supabase =
  typeof window === "undefined" ? getSupabaseServerClient() : getSupabaseBrowserClient()
