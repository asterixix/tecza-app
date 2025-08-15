/* Strona główna */

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Users, Shield, EarthLock, Calendar, Heart, HandCoins, Github, SmilePlus, Lightbulb } from "lucide-react"

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-10 md:py-16">
      {/* Sekcja o aplikacji */}
      <section id="about" aria-labelledby="about-heading" className="grid gap-6 md:grid-cols-2 md:gap-10 items-center">
        <div>
          <Badge className="mb-3" aria-hidden>Polska społeczność LGBTQ • Bezpieczna przestrzeń</Badge>
          <h1 id="about-heading" className="text-3xl md:text-5xl font-bold tracking-tight">
            Bezpieczna, nowoczesna społeczność LGBTQ w Polsce 🌈
          </h1>
          <p className="mt-4 text-muted-foreground text-base md:text-lg">
            Platforma, która łączy ludzi, wydarzenia i społeczności. Prywatność, dostępność i żywe, tęczowe doświadczenia — zawsze po Twojej stronie.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/r">
                Dołącz do nas!
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="#features">Poznaj Tęcza.app <Lightbulb className="size-4" /></Link>
            </Button>
          </div>
        </div>
        <div className="order-first md:order-none">
          <Card aria-label="Podgląd aplikacji" className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-[16/10] overflow-hidden">
              <Image src="/image/tecza-homepage.webp" alt="Osoby trzymające flagę tęczy z napisem 'Tęcza.app'" fill style={{ objectFit: "cover"}} decoding="async"/>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Funkcje */}
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

      {/* Współpraca */}
      <section id="contribute" aria-labelledby="contribute-heading" className="mt-14 md:mt-20">
        <h2 id="contribute-heading" className="text-2xl md:text-3xl font-semibold tracking-tight">Twórz z nami Tęcza.app 🌈 - Nowe miejsce dla społeczności LGBTQ+ w Internecie!</h2>
        <p className="mt-2 text-muted-foreground max-w-3xl">
          Szukamy osób chętnych do współpracy! Poszukujemy projektantów, specjalistów ds. dostępności, tłumaczy, moderatorów, a szczególnie programistów WebDev.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="mailto:artur@sendyka.dev">Dołącz do projektu <SmilePlus className="size-4" /></Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="https://github.com/asterixix/tecza-app">Projekt na Githubie <Github className="size-4" /></Link>
          </Button>
        </div>
        <p className="sr-only">Sekcja dla osób chcących pomóc w rozwoju projektu.</p>
      </section>
    </div>
  )
}

/* Funkcje - objekty */

const features = [
  {
    title: "Profile i znajomi",
    desc: "Zaawansowane profile, zaimki, tożsamości, prywatność, własne banery, dekoracje profilu.",
    icon: <Users className="size-4" aria-hidden />,
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
    title: "Szyfrowane wiadomości",
    desc: "Komunikacja szyfrowana end-to-end, brak zapisywania historii wiadomości.",
    icon: <EarthLock className="size-4" aria-hidden />,
  },
  {
    title: "Non-profit",
    desc: "Brak nastawienia na generowanie dochodu, reinwestowanie w rozwój, utrzymanie i wsparcie społeczności.",
    icon: <HandCoins className="size-4" aria-hidden />,
  },
  {
    title: "Otwartość i wkład",
    desc: "Transparentny rozwój, otwartość na wkład i pomysły społeczności.",
    icon: <Heart className="size-4" aria-hidden />,
  },
] as const
