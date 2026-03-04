"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

export default function AppEntryPage() {
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (mounted && !data.session) {
        router.replace("/")
      }
    })()
    return () => {
      mounted = false
    }
  }, [router])

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-10">
      <div className="mx-auto max-w-3xl">
        <Card className="shadow-sm">
          <CardContent className="p-8 space-y-5">
            <h1 className="text-3xl font-semibold">Linen Paneline Hoş Geldiniz</h1>
            <p className="text-muted-foreground">Projelerinize geçin, aktif batch review sürecini buradan yönetin.</p>
            <Link href="/dashboard">
              <Button>Panoyu aç</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
