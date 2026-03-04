import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function PricingPage() {
  const plans = [
    { name: "Başlangıç", price: "$49", desc: "Küçük ekipler ve dönemsel çekimler için" },
    { name: "Pro", price: "$129", desc: "Günlük üretim ve hızlı review döngüleri için" },
    { name: "Ajans", price: "$299", desc: "Çoklu müşteri ve yüksek hacim operasyonları için" },
  ]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl h-16 px-4 md:px-6 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-wide">Retouchio</Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/pricing" className="text-foreground">Fiyatlar</Link>
            <Link href="/showcase" className="text-muted-foreground hover:text-foreground">Örnekler</Link>
            <Link href="/app">
              <Button size="sm">Panoya geç</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 md:px-6 py-10 md:py-14 space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold">Fiyatlar</h1>
          <p className="text-muted-foreground">Kısası var: iş büyüdükçe plan da büyüyor. Uzunu da aşağıda.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.name} className="shadow-sm">
              <CardContent className="p-6 space-y-3">
                <p className="text-sm text-muted-foreground uppercase tracking-[0.12em]">{plan.name}</p>
                <p className="text-4xl font-semibold">{plan.price}</p>
                <p className="text-sm text-muted-foreground">{plan.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
