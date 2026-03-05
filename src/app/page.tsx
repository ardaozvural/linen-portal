"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
type Mode = "signin" | "signup"

export default function HomePage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("signin")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 6
  }, [email, password])
  // Zaten login ise direkt batch listesine (AUTO-REDIRECT KAPALI)
  // Not: Landing her zaman görünsün; Dashboard'a geçiş butonla yapılır.
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (signInError) throw signInError
        router.replace("/app/batches")
        return
      }

      // signup
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })
      if (signUpError) throw signUpError

      // Eğer email confirmation açıksa session gelmeyebilir
      if (!data.session) {
        setMessage("Hesabın oluşturuldu. Şimdi e-postanı doğrula, sonra giriş yap.")
      } else {
        setMessage("Hesabın oluşturuldu. Şimdi giriş yapabilirsin.")
        setMode("signin")
      }
    } catch (err: any) {
      const msg =
        err?.message ||
        (mode === "signin"
          ? "Giriş yapılamadı. E-posta/şifreyi kontrol et."
          : "Kayıt oluşturulamadı. Bilgileri kontrol edip tekrar dene.")
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex min-h-svh max-w-5xl items-center px-4 py-10">
        <div className="grid w-full gap-8 md:grid-cols-2 md:items-center">
          {/* Sol taraf: value prop */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              Retouchio • Ürün fotoğrafı stüdyosu
            </div>

            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Amatör fotoğrafı{" "}
              <span className="text-primary">listeye hazır</span> görsele çevir.
            </h1>

            <p className="text-muted-foreground">
              Preset seç, batch başlat, sonucu tek ekranda incele. Gerekiyorsa revizyon iste.
              (Evet, “fotoğraf çeken ajans” masrafı yok.)
            </p>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Tutarlı stüdyo görünümü</li>
              <li>• Batch üretim + hızlı inceleme</li>
              <li>• Ajans modu / danışman modu (hazır)</li>
            </ul>
          </div>

          {/* Sağ taraf: auth card */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">
                {mode === "signin" ? "Giriş yap" : "Kayıt ol"}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              
<div className="grid w-full grid-cols-2 gap-2">
  <button type="button" onClick={() => setMode("signin")} className={"h-9 rounded-md border border-border px-3 text-sm " + (mode === "signin" ? "bg-primary text-primary-foreground" : "bg-card")}>Giriş</button>
  <button type="button" onClick={() => setMode("signup")} className={"h-9 rounded-md border border-border px-3 text-sm " + (mode === "signup" ? "bg-primary text-primary-foreground" : "bg-card")}>Kayıt</button>
</div>


              <form onSubmit={onSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Şifre</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="En az 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                {message && <p className="text-sm text-muted-foreground">{message}</p>}

                <Button type="submit" className="w-full" disabled={isLoading || !canSubmit}>
                  {isLoading
                    ? mode === "signin"
                      ? "Giriş yapılıyor…"
                      : "Hesap oluşturuluyor…"
                    : mode === "signin"
                      ? "Giriş yap"
                      : "Kayıt ol"}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center">
                Giriş sonrası sizi batch listesinin olduğu ekrana yönlendiriyoruz.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}