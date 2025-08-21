"use client"

import { useEffect, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// E2EE messaging removed; crypto key manager not used

const schema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/i, "Tylko litery, cyfry i _"),
  display_name: z.string().min(1).max(60),
  bio: z.string().max(500).optional().nullable(),
  pronouns: z.string().max(32).optional().nullable(),
  sexual_orientation: z.array(z.string()).optional().nullable(),
  gender_identity: z.array(z.string()).optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().url().optional().nullable(),
  instagram: z.string().url().optional().nullable(),
  twitter: z.string().url().optional().nullable(),
  tiktok: z.string().url().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  profile_visibility: z.enum(["public", "friends", "private"]),
  show_location: z.boolean(),
  show_orientation: z.boolean(),
  show_friends: z.boolean().optional(),
  contact_whatsapp: z.string().optional().nullable(),
  contact_telegram: z.string().optional().nullable(),
  contact_signal: z.string().optional().nullable(),
  instagram_username: z.string().optional().nullable(),
  twitter_username: z.string().optional().nullable(),
  tiktok_username: z.string().optional().nullable(),
  show_contacts: z.boolean().optional(),
  show_socials: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

export default function SettingsPage() {
  const supabase = getSupabase()
  const [loading, setLoading] = useState(false)
  // Security state
  // E2EE vault removed as part of messaging system removal
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")
  const [mfaSupported, setMfaSupported] = useState(false)
  const [mfaEnrolled, setMfaEnrolled] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [mfaQR, setMfaQR] = useState<string>("")
  const [mfaSecret, setMfaSecret] = useState<string>("")
  const [otpCode, setOtpCode] = useState("")
  // OAuth state
  const [identities, setIdentities] = useState<
    Array<{ id?: string; provider?: string }>
  >([])
  // Accessibility
  const [reduceMotion, setReduceMotion] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("pref-reduce-motion") === "1"
  })
  const [fontScale, setFontScale] = useState<string>(() => {
    if (typeof window === "undefined") return "100"
    return localStorage.getItem("pref-font-scale") || "100"
  })
  // Private account email
  const [accountEmail, setAccountEmail] = useState<string>("")

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      display_name: "",
      bio: "",
      pronouns: "",
      sexual_orientation: [],
      gender_identity: [],
      email: "",
      website: "",
      instagram: "",
      twitter: "",
      tiktok: "",
      city: "",
      country: "Poland",
      profile_visibility: "public",
      show_location: false,
      show_orientation: true,
      show_friends: true,
      contact_whatsapp: "",
      contact_telegram: "",
      contact_signal: "",
      instagram_username: "",
      twitter_username: "",
      tiktok_username: "",
      show_contacts: true,
      show_socials: true,
    },
  })

  useEffect(() => {
    async function load() {
      if (!supabase) return
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) return
      setAccountEmail(user.email || "")
      // identities (OAuth links)
      try {
        const ids =
          (user.identities as Array<{ id?: string; provider?: string }>) || []
        setIdentities(ids)
      } catch {}
      const { data } = await supabase
        .from("profiles")
        .select(
          "username,display_name,bio,pronouns,sexual_orientation,gender_identity,email,website,social_links,city,country,profile_visibility,show_location,show_orientation,avatar_url,cover_image_url,show_friends,contact_whatsapp,contact_telegram,contact_signal,instagram_username,twitter_username,tiktok_username,show_contacts,show_socials",
        )
        .eq("id", user.id)
        .maybeSingle()
      if (data) {
        type SocialLinks = {
          instagram?: string
          twitter?: string
          tiktok?: string
        }
        type ProfileRow = {
          username: string | null
          display_name: string | null
          bio: string | null
          pronouns: string | null
          sexual_orientation: string[] | null
          gender_identity: string[] | null
          email: string | null
          website: string | null
          social_links: SocialLinks | null
          city: string | null
          country: string | null
          profile_visibility: "public" | "friends" | "private" | null
          show_location: boolean | null
          show_orientation: boolean | null
          show_friends?: boolean | null
          contact_whatsapp?: string | null
          contact_telegram?: string | null
          contact_signal?: string | null
          instagram_username?: string | null
          twitter_username?: string | null
          tiktok_username?: string | null
          show_contacts?: boolean | null
          show_socials?: boolean | null
        }
        const row = data as unknown as ProfileRow
        const socials = (row.social_links || {}) as Record<string, string>
        form.reset({
          username: row.username || "",
          display_name: row.display_name || "",
          bio: row.bio || "",
          pronouns: row.pronouns || "",
          sexual_orientation: row.sexual_orientation || [],
          gender_identity: row.gender_identity || [],
          email: row.email || "",
          website: row.website || "",
          instagram: socials.instagram || "",
          twitter: socials.twitter || "",
          tiktok: socials.tiktok || "",
          city: row.city || "",
          country: row.country || "Poland",
          profile_visibility: row.profile_visibility || "public",
          show_location: !!row.show_location,
          show_orientation: !!row.show_orientation,
          show_friends: (row.show_friends ?? true) as boolean,
          contact_whatsapp: row.contact_whatsapp || "",
          contact_telegram: row.contact_telegram || "",
          contact_signal: row.contact_signal || "",
          instagram_username: row.instagram_username || "",
          twitter_username: row.twitter_username || "",
          tiktok_username: row.tiktok_username || "",
          show_contacts: (row.show_contacts ?? true) as boolean,
          show_socials: (row.show_socials ?? true) as boolean,
        })
      }
      // MFA capability and status
      try {
        if (supabase.auth.mfa) {
          setMfaSupported(true)
          const res = await supabase.auth.mfa.listFactors?.()
          const enrolled: Array<{ id: string; factor_type?: string }> =
            (res?.data?.all as Array<{ id: string; factor_type?: string }>) ??
            []
          const totp = enrolled.find((f) => f.factor_type === "totp")
          setMfaEnrolled(!!totp)
          if (totp) setMfaFactorId(totp.id)
        }
      } catch {
        setMfaSupported(false)
      }
    }
    load()
  }, [supabase, form])

  async function onSubmit(values: FormValues) {
    if (!supabase) return toast.error("Brak konfiguracji Supabase")
    setLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) throw new Error("Brak zalogowanego użytkownika")

      const { error } = await supabase
        .from("profiles")
        .update({
          profile_visibility: values.profile_visibility,
          show_location: values.show_location,
          show_orientation: values.show_orientation,
          show_friends: values.show_friends ?? true,
          contact_whatsapp: values.contact_whatsapp || null,
          contact_telegram: values.contact_telegram || null,
          contact_signal: values.contact_signal || null,
          instagram_username: values.instagram_username || null,
          twitter_username: values.twitter_username || null,
          tiktok_username: values.tiktok_username || null,
          show_contacts: values.show_contacts ?? true,
          show_socials: values.show_socials ?? true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
      if (error) throw error
      toast.success("Zapisano profil")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się zapisać"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-6">
      <h1 className="text-2xl font-bold tracking-tight mb-4">Ustawienia</h1>
      <Tabs defaultValue="privacy">
        <TabsList className="mb-4 flex flex-wrap gap-2">
          <TabsTrigger value="privacy">Prywatność</TabsTrigger>
          <TabsTrigger value="security">Bezpieczeństwo</TabsTrigger>
          <TabsTrigger value="accessibility">Dostępność</TabsTrigger>
          <TabsTrigger value="danger">Strefa ryzyka</TabsTrigger>
          <TabsTrigger value="notifications">Powiadomienia</TabsTrigger>
        </TabsList>

        <TabsContent value="privacy">
          <Card>
            <CardContent className="p-4 grid gap-4">
              <Form {...form}>
                <p className="text-sm text-muted-foreground">
                  Ustaw widoczność profilu i elementów widocznych publicznie.
                </p>
                {/* Reuse existing privacy toggles by rendering the same fields here for quick access */}
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="profile_visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Widoczność profilu</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Publiczny" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Publiczny</SelectItem>
                            <SelectItem value="friends">
                              Tylko znajomi
                            </SelectItem>
                            <SelectItem value="private">Prywatny</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="show_location"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border p-3">
                        <FormLabel className="m-0">
                          Pokazuj lokalizację
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="show_orientation"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border p-3">
                        <FormLabel className="m-0">
                          Pokazuj orientację/tożsamość
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="show_friends"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border p-3">
                        <FormLabel className="m-0">
                          Pokazuj listę znajomych
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="show_contacts"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border p-3">
                        <FormLabel className="m-0">
                          Pokazuj dane kontaktowe (WhatsApp/Telegram/Signal)
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="show_socials"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border p-3">
                        <FormLabel className="m-0">
                          Pokazuj profile społecznościowe
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact_whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp (numer telefonu)</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="np. +48 600 000 000"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_telegram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telegram (nazwa użytkownika)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="np. username"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_signal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Signal (numer telefonu)</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="np. +48 600 000 000"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="instagram_username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram (username)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="np. tecza"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="twitter_username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter/X (username)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="np. tecza"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tiktok_username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TikTok (username)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="np. tecza"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <Button
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={loading}
                  >
                    {loading ? "Zapisywanie…" : "Zapisz prywatność"}
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardContent className="p-4 grid gap-4 max-w-2xl">
              <h2 className="text-lg font-semibold">Ustawienia powiadomień</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {/* Category toggles loaded/saved from notification_settings */}
                <ToggleSetting
                  field="enable_friend_requests"
                  label="Prośby o połączenie"
                />
                <ToggleSetting field="enable_mentions" label="Wzmianki (@)" />
                <ToggleSetting
                  field="enable_community_posts"
                  label="Posty w społecznościach"
                />
                <ToggleSetting
                  field="enable_following_posts"
                  label="Nowe posty obserwowanych"
                />
              </div>
              <PushControls />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid gap-4">
            <Card>
              <CardContent className="p-4 grid gap-3">
                <h2 className="text-lg font-semibold">2FA (TOTP)</h2>
                {!mfaSupported ? (
                  <p className="text-sm text-muted-foreground">
                    2FA nie jest dostępne w tej instancji. Upewnij się, że MFA
                    jest włączone w Supabase.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {mfaEnrolled ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">2FA jest włączone.</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              if (!supabase) {
                                toast.error("Brak konfiguracji Supabase")
                                return
                              }
                              if (!mfaFactorId) return
                              await supabase.auth.mfa.unenroll({
                                factorId: mfaFactorId,
                              })
                              setMfaEnrolled(false)
                              setMfaFactorId(null)
                              toast.success("Wyłączono 2FA")
                            } catch {
                              toast.error("Nie udało się wyłączyć 2FA")
                            }
                          }}
                        >
                          Wyłącz
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              if (!supabase) {
                                toast.error("Brak konfiguracji Supabase")
                                return
                              }
                              const { data, error } =
                                await supabase.auth.mfa.enroll({
                                  factorType: "totp",
                                })
                              if (error) throw error
                              const { id, totp } = data || {}
                              setMfaFactorId(id || null)
                              setMfaQR(totp?.qr_code || "")
                              setMfaSecret(totp?.secret || "")
                              toast.message(
                                "Zeskanuj kod i wpisz kod z aplikacji.",
                              )
                            } catch {
                              toast.error(
                                "Nie udało się rozpocząć rejestracji 2FA",
                              )
                            }
                          }}
                        >
                          Włącz 2FA
                        </Button>
                        {(mfaQR || mfaSecret) && (
                          <div className="grid gap-2">
                            {mfaQR && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={mfaQR}
                                alt="Kod QR 2FA"
                                className="h-40 w-40"
                              />
                            )}
                            {mfaSecret && (
                              <p className="text-xs text-muted-foreground">
                                Sekret: {mfaSecret}
                              </p>
                            )}
                            <div className="flex items-center gap-2">
                              <Input
                                placeholder="Kod z aplikacji"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                className="max-w-[160px]"
                              />
                              <Button
                                size="sm"
                                onClick={async () => {
                                  try {
                                    if (!supabase) {
                                      toast.error("Brak konfiguracji Supabase")
                                      return
                                    }
                                    if (!mfaFactorId || !otpCode) return
                                    const ch =
                                      await supabase.auth.mfa.challenge({
                                        factorId: mfaFactorId,
                                      })
                                    const challengeId = (
                                      ch?.data as { id?: string } | undefined
                                    )?.id
                                    if (!challengeId)
                                      throw new Error(
                                        "Brak identyfikatora wyzwania 2FA",
                                      )
                                    const { error: verr } =
                                      await supabase.auth.mfa.verify({
                                        factorId: mfaFactorId,
                                        code: otpCode,
                                        challengeId,
                                      })
                                    if (verr) throw verr
                                    setMfaEnrolled(true)
                                    setMfaQR("")
                                    setMfaSecret("")
                                    setOtpCode("")
                                    toast.success("2FA włączone")
                                  } catch {
                                    toast.error(
                                      "Nie udało się zweryfikować kodu 2FA",
                                    )
                                  }
                                }}
                              >
                                Zatwierdź
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 grid gap-3">
                <h2 className="text-lg font-semibold">Zmiana hasła</h2>
                <div className="grid md:grid-cols-2 gap-2 max-w-lg">
                  <Input
                    type="password"
                    placeholder="Nowe hasło"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Input
                    type="password"
                    placeholder="Powtórz hasło"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                  />
                </div>
                <div>
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        if (!supabase) {
                          toast.error("Brak konfiguracji Supabase")
                          return
                        }
                        if (!password || password !== password2) {
                          toast.error("Hasła nie są zgodne")
                          return
                        }
                        const { error } = await supabase.auth.updateUser({
                          password,
                        })
                        if (error) throw error
                        setPassword("")
                        setPassword2("")
                        toast.success("Hasło zmienione")
                      } catch {
                        toast.error("Nie udało się zmienić hasła")
                      }
                    }}
                  >
                    Zapisz hasło
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 grid gap-3">
                <h2 className="text-lg font-semibold">
                  Email konta (prywatny)
                </h2>
                <div className="grid md:grid-cols-2 gap-2 max-w-lg">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        if (!supabase) {
                          toast.error("Brak konfiguracji Supabase")
                          return
                        }
                        const { error } = await supabase.auth.updateUser({
                          email: accountEmail,
                        })
                        if (error) throw error
                        toast.success(
                          "Zaktualizowano email. Sprawdź skrzynkę, aby potwierdzić.",
                        )
                      } catch {
                        toast.error("Nie udało się zaktualizować emaila")
                      }
                    }}
                  >
                    Zapisz email
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ten email służy do logowania i odzyskiwania konta. Nie jest
                  wyświetlany publicznie.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 grid gap-3">
                <h2 className="text-lg font-semibold">Połączenia OAuth</h2>
                <div className="text-sm text-muted-foreground">
                  Połącz dodatkowe logowanie przez Google lub Discord.
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        if (!supabase) {
                          toast.error("Brak konfiguracji Supabase")
                          return
                        }
                        const { data, error } =
                          await supabase.auth.linkIdentity({
                            provider: "google",
                            options: {
                              redirectTo: `${window.location.origin}/settings`,
                            },
                          })
                        if (error) throw error
                        if (data?.url) window.location.href = data.url
                      } catch {
                        toast.error(
                          "Nie udało się zainicjować połączenia Google",
                        )
                      }
                    }}
                  >
                    Połącz Google
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        if (!supabase) {
                          toast.error("Brak konfiguracji Supabase")
                          return
                        }
                        const { data, error } =
                          await supabase.auth.linkIdentity({
                            provider: "discord",
                            options: {
                              redirectTo: `${window.location.origin}/settings`,
                            },
                          })
                        if (error) throw error
                        if (data?.url) window.location.href = data.url
                      } catch {
                        toast.error(
                          "Nie udało się zainicjować połączenia Discord",
                        )
                      }
                    }}
                  >
                    Połącz Discord
                  </Button>
                </div>
                <div className="text-sm">
                  Połączone:{" "}
                  {identities.length
                    ? identities.map((i) => i.provider).join(", ")
                    : "brak"}
                </div>
              </CardContent>
            </Card>

            {/* Removed E2EE keys section */}
          </div>
        </TabsContent>

        <TabsContent value="accessibility">
          <Card>
            <CardContent className="p-4 grid gap-3 max-w-xl">
              <p className="text-sm text-muted-foreground">
                Preferencje wyświetlania zapisywane lokalnie w przeglądarce.
              </p>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="font-medium">Ogranicz animacje</div>
                  <div className="text-sm text-muted-foreground">
                    Zmniejsza ruchome animacje i przejścia.
                  </div>
                </div>
                <Switch
                  checked={reduceMotion}
                  onCheckedChange={(v) => {
                    setReduceMotion(v)
                    try {
                      localStorage.setItem("pref-reduce-motion", v ? "1" : "0")
                    } catch {}
                    document.documentElement.classList.toggle(
                      "reduce-motion",
                      v,
                    )
                  }}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3 gap-3">
                <div>
                  <div className="font-medium">Skala czcionki</div>
                  <div className="text-sm text-muted-foreground">
                    Powiększ lub zmniejsz bazowy rozmiar tekstu.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="range"
                    min={90}
                    max={130}
                    step={5}
                    value={fontScale}
                    onChange={(e) => {
                      const v = e.target.value
                      setFontScale(v)
                      try {
                        localStorage.setItem("pref-font-scale", v)
                      } catch {}
                      document.documentElement.style.setProperty(
                        "--app-font-scale",
                        `${v}%`,
                      )
                    }}
                  />
                  <div className="w-14 text-right text-sm text-muted-foreground">
                    {fontScale}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card>
            <CardContent className="p-4 grid gap-3">
              <h2 className="text-lg font-semibold text-red-600">Usuń konto</h2>
              <p className="text-sm text-muted-foreground">
                To usunie Twoje posty, interakcje i połączenia. Tej operacji nie
                można cofnąć.
              </p>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    if (!supabase) {
                      toast.error("Brak konfiguracji Supabase")
                      return
                    }
                    const me = (await supabase.auth.getUser()).data.user
                    if (!me) throw new Error("Brak użytkownika")
                    // Best effort client-side cleanup under RLS
                    await supabase
                      .from("post_interactions")
                      .delete()
                      .eq("user_id", me.id)
                    await supabase.from("posts").delete().eq("user_id", me.id)
                    await supabase
                      .from("friend_requests")
                      .delete()
                      .or(`sender_id.eq.${me.id},receiver_id.eq.${me.id}`)
                    await supabase
                      .from("friendships")
                      .delete()
                      .or(`user1_id.eq.${me.id},user2_id.eq.${me.id}`)
                    await supabase.from("profiles").delete().eq("id", me.id)
                    // Sign out after cleanup
                    await supabase.auth.signOut()
                    window.location.href = "/"
                  } catch {
                    toast.error(
                      "Nie udało się usunąć konta. Skontaktuj się ze wsparciem.",
                    )
                  }
                }}
              >
                Usuń moje konto
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ToggleSetting({
  field,
  label,
}: {
  field:
    | "enable_friend_requests"
    | "enable_mentions"
    | "enable_community_posts"
    | "enable_following_posts"
  label: string
}) {
  const supabase = getSupabase()
  const [checked, setChecked] = useState<boolean>(true)
  const [loading, setLoading] = useState(true)
  type NotificationSettingsRow = {
    user_id: string
    enable_friend_requests?: boolean | null
    enable_mentions?: boolean | null
    enable_community_posts?: boolean | null
    enable_following_posts?: boolean | null
    push_enabled?: boolean | null
  }

  useEffect(() => {
    ;(async () => {
      if (!supabase) return
      const me = (await supabase.auth.getUser()).data.user
      if (!me) return
      const { data } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("user_id", me.id)
        .maybeSingle()
      if (data) {
        const row = data as unknown as NotificationSettingsRow
        setChecked(Boolean(row[field]))
      }
      setLoading(false)
    })()
  }, [supabase, field])

  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div>
        <div className="font-medium">{label}</div>
      </div>
      <Switch
        checked={checked}
        disabled={loading}
        onCheckedChange={async (v) => {
          setChecked(v)
          if (!supabase) return
          const me = (await supabase.auth.getUser()).data.user
          if (!me) return
          type NotificationSettingsUpdate = {
            user_id: string
            enable_friend_requests?: boolean
            enable_mentions?: boolean
            enable_community_posts?: boolean
            enable_following_posts?: boolean
          }
          const update: NotificationSettingsUpdate = {
            user_id: me.id,
            [field]: v,
          } as NotificationSettingsUpdate
          await supabase.from("notification_settings").upsert(update)
        }}
      />
    </div>
  )
}

function PushControls() {
  const supabase = getSupabase()
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      if (!supabase) return
      const me = (await supabase.auth.getUser()).data.user
      if (!me) return
      const { data } = await supabase
        .from("notification_settings")
        .select("push_enabled")
        .eq("user_id", me.id)
        .maybeSingle()
      setEnabled(!!data?.push_enabled)
      setLoading(false)
    })()
  }, [supabase])

  return (
    <div className="rounded-md border p-3">
      <div className="font-medium mb-1">Powiadomienia push (przeglądarka)</div>
      <div className="text-sm text-muted-foreground mb-2">
        Wymaga zgody przeglądarki i obsługi przez Service Worker.
      </div>
      <Button
        size="sm"
        variant={enabled ? "secondary" : "default"}
        disabled={loading}
        onClick={async () => {
          if (!supabase) return
          const me = (await supabase.auth.getUser()).data.user
          if (!me) return
          const next = !enabled
          setEnabled(next)
          const update: { user_id: string; push_enabled: boolean } = {
            user_id: me.id,
            push_enabled: next,
          }
          await supabase.from("notification_settings").upsert(update)
        }}
      >
        {enabled ? "Wyłącz push" : "Włącz push"}
      </Button>
    </div>
  )
}
