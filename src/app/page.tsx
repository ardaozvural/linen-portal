import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-12">
      <Card className="w-[480px] shadow-md">
        <CardContent className="p-8 space-y-6">
          <h1 className="text-3xl font-serif">Linen</h1>
          <p className="text-sm text-muted-foreground">
            Your work, reviewed.
          </p>
	<Link href="/dashboard">
	  <Button className="w-full sm:w-auto">Open dashboard</Button>
	</Link>
        </CardContent>
      </Card>
    </main>
  )
}
