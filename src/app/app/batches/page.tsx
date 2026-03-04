"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Batch = {
  id: string
  name: string
  created_at: string
}

export default function BatchesPage() {
  const router = useRouter()
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (!active) return
      if (!data.session) {
        router.replace("/")
      }
    })()
    return () => {
      active = false
    }
  }, [router])

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!active) return
      if (!sessionData.session) {
        router.replace("/")
        return
      }

      const { data, error } = await supabase
        .from("batches")
        .select("id, name, created_at")
        .order("created_at", { ascending: false })
        .limit(12)

      if (!active) return
      if (error) {
        setError(error.message)
        setBatches([])
        setLoading(false)
        return
      }

      setBatches((data || []) as Batch[])
      setLoading(false)
    })()

    return () => {
      active = false
    }
  }, [router])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl h-16 px-4 md:px-6 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-wide">Retouchio</Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground">Fiyatlar</Link>
            <Link href="/showcase" className="text-muted-foreground hover:text-foreground">Örnekler</Link>
            <Link href="/app/batches">
              <Button size="sm">Batch listesi</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 md:px-6 py-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Batch Listesi</h1>
            <p className="text-sm text-muted-foreground">Yeni görseller yüklendikçe buradan başlayın.</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="outline" className="border-border text-foreground">
              {batches.length} batch
            </Badge>
            <Button variant="outline" size="sm" onClick={() => router.refresh()}>
              En sonu al
            </Button>
          </div>
        </div>

        {loading ? (
          <Card className="p-6 text-sm text-muted-foreground">Yükleniyor…</Card>
        ) : error ? (
          <Card className="p-6 text-sm text-destructive">Supabase hatası: {error}</Card>
        ) : batches.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">Henüz batch yok.</Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {batches.map((batch) => (
              <Card key={batch.id} className="shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold truncate">{batch.name}</p>
                    <Badge variant="outline" className="border-border text-foreground">
                      {new Date(batch.created_at).toLocaleDateString("tr-TR")}
                    </Badge>
                  </div>
                  <div className="flex justify-end">
                    <Link href={`/projects/${batch.id}`}>
                      <Button size="sm">İncele</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
