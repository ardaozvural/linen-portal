import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function ShowcasePage() {
  const items = [
    "Giyim ürünleri için temiz arka plan dönüşümleri",
    "Çanta ve aksesuarlarda hızlı revizyon akışı",
    "Yüksek hacimli batch onay hattı",
  ]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl h-16 px-4 md:px-6 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-wide">Retouchio</Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground">Fiyatlar</Link>
            <Link href="/showcase" className="text-foreground">Örnekler</Link>
            <Link href="/app">
              <Button size="sm">Panoya geç</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 md:px-6 py-10 md:py-14 space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold">Örnekler</h1>
          <p className="text-muted-foreground">Gerçek iş akışlarından kısa, net ve bol sonuçlu örnekler.</p>
        </div>

        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item} className="shadow-sm">
              <CardContent className="p-5 text-muted-foreground">{item}</CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
