import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Users, Shield, Sparkles, MessagesSquare, Calendar, Globe, Heart } from "lucide-react"

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-10 md:py-16">
      {/* Hero / About */}
      <section id="about" aria-labelledby="about-heading" className="grid gap-6 md:grid-cols-2 md:gap-10 items-center">
        <div>
          <Badge className="mb-3" aria-hidden>Polska społeczność LGBTQ • Bezpieczna przestrzeń</Badge>
          <h1 id="about-heading" className="text-3xl md:text-5xl font-bold tracking-tight">
            Tęcza.app — bezpieczna, nowoczesna społeczność LGBTQ w Polsce
          </h1>
          <p className="mt-4 text-muted-foreground text-base md:text-lg">
            Platforma, która łączy ludzi, wydarzenia i społeczności. Prywatność, dostępność i żywe, tęczowe doświadczenia — zawsze po Twojej stronie.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="#features">
                Poznaj funkcje
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="#feed">Zobacz publiczny feed</Link>
            </Button>
          </div>
        </div>
        <div className="order-first md:order-none">
          <Card aria-label="Podgląd aplikacji" className="overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-[16/10] bg-gradient-to-br from-[var(--pride-red,_#e40303)] via-[var(--pride-orange,_#ff8c00)] to-[var(--pride-purple,_#732982)]" />
            </CardContent>
          </Card>
          <p className="sr-only">Ilustracja tęczowego gradientu symbolizującego różnorodność.</p>
        </div>
      </section>

      {/* Public feed teaser */}
      <section id="feed" aria-labelledby="feed-heading" className="mt-14 md:mt-20">
        <h2 id="feed-heading" className="text-2xl md:text-3xl font-semibold tracking-tight">Publiczny feed</h2>
        <p className="mt-2 text-muted-foreground max-w-3xl">
          Przeglądaj najnowsze publiczne posty, hashtagi i wydarzenia od społeczności. Dołącz, aby polubić, komentować i budować relacje.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} aria-label={`Podgląd posta ${i}`} className="">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4" aria-hidden />
                  @użytkownik{i}
                </div>
                <p className="mt-2 text-sm">
                  „Miłość jest miłością. Do zobaczenia na #PrideWarsaw!”
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" aria-labelledby="features-heading" className="mt-14 md:mt-20">
        <h2 id="features-heading" className="text-2xl md:text-3xl font-semibold tracking-tight">Najważniejsze funkcje</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {f.icon}
                  {f.title}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contribute */}
      <section id="contribute" aria-labelledby="contribute-heading" className="mt-14 md:mt-20">
        <h2 id="contribute-heading" className="text-2xl md:text-3xl font-semibold tracking-tight">Współtwórz Tęcza.app</h2>
        <p className="mt-2 text-muted-foreground max-w-3xl">
          Szukamy osób chętnych do współpracy: projektowanie, dostępność, tłumaczenia, moderacja, a także kod (Next.js, shadcn/ui, Supabase).
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/contribute">Dołącz do projektu</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/docs">Dokumentacja</Link>
          </Button>
        </div>
        <p className="sr-only">Sekcja dla osób chcących pomóc w rozwoju projektu.</p>
      </section>

      {/* Trust strip */}
      <section aria-label="Prywatność i bezpieczeństwo" className="mt-14 md:mt-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Info icon={<Shield className="size-4" aria-hidden />} text="Prywatność i kontrola widoczności" />
          <Info icon={<Sparkles className="size-4" aria-hidden />} text="Płynny UX i szybkie PWA" />
          <Info icon={<Globe className="size-4" aria-hidden />} text="Wielojęzyczność (PL, EN i więcej)" />
          <Info icon={<Heart className="size-4" aria-hidden />} text="Tworzone z miłością dla społeczności" />
        </div>
      </section>
    </div>
  )
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {icon}
      <span>{text}</span>
    </div>
  )
}

const features = [
  {
    title: "Profile i znajomi",
    desc: "Zaawansowane profile, pronouns, tożsamości, prywatność; łączenie się jak w BARQ.",
    icon: <Users className="size-4" aria-hidden />,
  },
  {
    title: "Posty i komentarze",
    desc: "Markdown, emoji, hashtagi, wzmianki i szybkie reakcje w czasie rzeczywistym.",
    icon: <MessagesSquare className="size-4" aria-hidden />,
  },
  {
    title: "Wydarzenia i społeczności",
    desc: "Lokalne grupy wsparcia, mapy wydarzeń, role i kanały dyskusji.",
    icon: <Calendar className="size-4" aria-hidden />,
  },
  {
    title: "Moderacja i bezpieczeństwo",
    desc: "Zgłoszenia, blokady, kontrola widoczności i dostępności treści.",
    icon: <Shield className="size-4" aria-hidden />,
  },
  {
    title: "PWA i offline",
    desc: "Instalacja na ekranie głównym, powiadomienia push i szybkie działanie offline.",
    icon: <Sparkles className="size-4" aria-hidden />,
  },
  {
    title: "Otwartość i wkład",
    desc: "Transparentny rozwój, mile widziane kontrybucje i pomysły społeczności.",
    icon: <Heart className="size-4" aria-hidden />,
  },
] as const
