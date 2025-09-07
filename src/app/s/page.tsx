"use client"

import { useEffect, useState, useMemo } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Shield,
  Bell,
  Eye,
  Palette,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Settings,
  User,
  Lock,
  Smartphone,
  Globe,
  Heart,
  Mail,
} from "lucide-react"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("privacy")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

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
    mode: "onChange",
  })

  // Search functionality
  const settingsSections = useMemo(() => {
    const sections = [
      {
        id: "privacy",
        title: "Prywatność",
        icon: Eye,
        description: "Kontroluj widoczność swojego profilu",
        keywords: [
          "prywatność",
          "widoczność",
          "profil",
          "publiczny",
          "prywatny",
          "znajomi",
          "lokalizacja",
          "orientacja",
          "kontakt",
          "social media",
        ],
      },
      {
        id: "notifications",
        title: "Powiadomienia",
        icon: Bell,
        description: "Zarządzaj powiadomieniami push",
        keywords: [
          "powiadomienia",
          "push",
          "dźwięk",
          "alert",
          "prośby",
          "wzmianki",
          "posty",
        ],
      },
      {
        id: "security",
        title: "Bezpieczeństwo",
        icon: Shield,
        description: "2FA, hasło i połączenia OAuth",
        keywords: [
          "bezpieczeństwo",
          "2fa",
          "hasło",
          "oauth",
          "google",
          "discord",
          "email",
          "konto",
        ],
      },
      {
        id: "accessibility",
        title: "Dostępność",
        icon: Palette,
        description: "Preferencje wyświetlania",
        keywords: [
          "dostępność",
          "animacje",
          "czcionka",
          "skala",
          "ruch",
          "tekst",
        ],
      },
      {
        id: "danger",
        title: "Strefa ryzyka",
        icon: Trash2,
        description: "Usuwanie konta",
        keywords: ["usuwanie", "konto", "ryzyko", "nieodwracalne", "dane"],
      },
    ]

    if (!searchQuery.trim()) return sections

    const query = searchQuery.toLowerCase()
    return sections.filter(
      (section) =>
        section.title.toLowerCase().includes(query) ||
        section.description.toLowerCase().includes(query) ||
        section.keywords.some((keyword) => keyword.includes(query)),
    )
  }, [searchQuery])

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

      setHasUnsavedChanges(false)
      toast.success("Ustawienia prywatności zostały zapisane", {
        description: "Twoje zmiany zostały pomyślnie zastosowane",
        icon: <CheckCircle className="h-4 w-4" />,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się zapisać"
      toast.error("Błąd podczas zapisywania", {
        description: msg,
        icon: <AlertCircle className="h-4 w-4" />,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Ustawienia</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Zarządzaj swoim kontem, prywatnością i preferencjami
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj ustawień..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Konto aktywne</p>
              <p className="text-xs text-muted-foreground">
                Wszystko w porządku
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Bezpieczeństwo</p>
              <p className="text-xs text-muted-foreground">
                {mfaEnrolled ? "2FA włączone" : "2FA wyłączone"}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bell className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Powiadomienia</p>
              <p className="text-xs text-muted-foreground">Push włączone</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Eye className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Prywatność</p>
              <p className="text-xs text-muted-foreground">Profil publiczny</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Settings Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1 p-1 bg-muted">
          {settingsSections.map((section) => {
            const Icon = section.icon
            return (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className="flex items-center gap-2 data-[state=active]:bg-background"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{section.title}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="privacy" className="space-y-6">
          <div className="grid gap-6">
            {/* Profile Visibility Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Widoczność profilu
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Kontroluj, kto może zobaczyć Twój profil i jego zawartość
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="profile_visibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">
                            Poziom widoczności profilu
                          </FormLabel>
                          <FormDescription>
                            Wybierz, kto może przeglądać Twój profil
                          </FormDescription>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value)
                              setHasUnsavedChanges(true)
                            }}
                          >
                            <SelectTrigger className="w-full md:w-80">
                              <SelectValue placeholder="Wybierz poziom widoczności" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">Publiczny</div>
                                    <div className="text-xs text-muted-foreground">
                                      Wszyscy mogą zobaczyć Twój profil
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="friends">
                                <div className="flex items-center gap-2">
                                  <Heart className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">
                                      Tylko znajomi
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Tylko Twoi znajomi mogą zobaczyć profil
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="private">
                                <div className="flex items-center gap-2">
                                  <Lock className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">Prywatny</div>
                                    <div className="text-xs text-muted-foreground">
                                      Profil widoczny tylko dla Ciebie
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              </CardContent>
            </Card>

            {/* Content Visibility Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Widoczność zawartości
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Kontroluj, które elementy Twojego profilu są widoczne dla
                  innych
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      <FormField
                        control={form.control}
                        name="show_location"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                            <div className="space-y-1">
                              <FormLabel className="text-base font-medium">
                                Pokazuj lokalizację
                              </FormLabel>
                              <FormDescription className="text-sm">
                                Wyświetlaj miasto i kraj w swoim profilu
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked)
                                  setHasUnsavedChanges(true)
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="show_orientation"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                            <div className="space-y-1">
                              <FormLabel className="text-base font-medium">
                                Pokazuj orientację/tożsamość
                              </FormLabel>
                              <FormDescription className="text-sm">
                                Wyświetlaj informacje o orientacji seksualnej i
                                tożsamości płciowej
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked)
                                  setHasUnsavedChanges(true)
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="show_friends"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                            <div className="space-y-1">
                              <FormLabel className="text-base font-medium">
                                Pokazuj listę znajomych
                              </FormLabel>
                              <FormDescription className="text-sm">
                                Pozwól innym zobaczyć Twoją listę znajomych
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={!!field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked)
                                  setHasUnsavedChanges(true)
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="show_contacts"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                            <div className="space-y-1">
                              <FormLabel className="text-base font-medium">
                                Pokazuj dane kontaktowe
                              </FormLabel>
                              <FormDescription className="text-sm">
                                Wyświetlaj WhatsApp, Telegram i Signal w profilu
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={!!field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked)
                                  setHasUnsavedChanges(true)
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="show_socials"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                            <div className="space-y-1">
                              <FormLabel className="text-base font-medium">
                                Pokazuj profile społecznościowe
                              </FormLabel>
                              <FormDescription className="text-sm">
                                Wyświetlaj Instagram, Twitter i TikTok w profilu
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={!!field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked)
                                  setHasUnsavedChanges(true)
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </Form>
              </CardContent>
            </Card>

            {/* Contact Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Informacje kontaktowe
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Dodaj swoje dane kontaktowe i profile społecznościowe
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contact_whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp (numer telefonu)</FormLabel>
                            <FormDescription className="text-sm">
                              Dodaj numer telefonu do kontaktu przez WhatsApp
                            </FormDescription>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="np. +48 600 000 000"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  field.onChange(e)
                                  setHasUnsavedChanges(true)
                                }}
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
                            <FormDescription className="text-sm">
                              Dodaj nazwę użytkownika Telegram
                            </FormDescription>
                            <FormControl>
                              <Input
                                placeholder="np. username"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  field.onChange(e)
                                  setHasUnsavedChanges(true)
                                }}
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
                            <FormDescription className="text-sm">
                              Dodaj numer telefonu do kontaktu przez Signal
                            </FormDescription>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="np. +48 600 000 000"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  field.onChange(e)
                                  setHasUnsavedChanges(true)
                                }}
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
                            <FormDescription className="text-sm">
                              Dodaj nazwę użytkownika Instagram
                            </FormDescription>
                            <FormControl>
                              <Input
                                placeholder="np. tecza"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  field.onChange(e)
                                  setHasUnsavedChanges(true)
                                }}
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
                            <FormDescription className="text-sm">
                              Dodaj nazwę użytkownika Twitter/X
                            </FormDescription>
                            <FormControl>
                              <Input
                                placeholder="np. tecza"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  field.onChange(e)
                                  setHasUnsavedChanges(true)
                                }}
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
                            <FormDescription className="text-sm">
                              Dodaj nazwę użytkownika TikTok
                            </FormDescription>
                            <FormControl>
                              <Input
                                placeholder="np. tecza"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  field.onChange(e)
                                  setHasUnsavedChanges(true)
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </Form>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={loading || !hasUnsavedChanges}
                className="min-w-[140px]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Zapisz zmiany
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="grid gap-6">
            {/* Notification Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Kategorie powiadomień
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Wybierz, o jakich zdarzeniach chcesz otrzymywać powiadomienia
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <ToggleSetting
                    field="enable_friend_requests"
                    label="Prośby o połączenie"
                    description="Powiadomienia o nowych prośbach o dodanie do znajomych"
                  />
                  <ToggleSetting
                    field="enable_mentions"
                    label="Wzmianki (@)"
                    description="Powiadomienia gdy ktoś Cię wspomni w poście lub komentarzu"
                  />
                  <ToggleSetting
                    field="enable_community_posts"
                    label="Posty w społecznościach"
                    description="Powiadomienia o nowych postach w społecznościach, do których należysz"
                  />
                  <ToggleSetting
                    field="enable_following_posts"
                    label="Nowe posty obserwowanych"
                    description="Powiadomienia o nowych postach od osób, które obserwujesz"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Push Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Powiadomienia push
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Zarządzaj powiadomieniami push w przeglądarce
                </p>
              </CardHeader>
              <CardContent>
                <PushControls />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6">
            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Dwuskładnikowe uwierzytelnianie (2FA)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Dodaj dodatkową warstwę bezpieczeństwa do swojego konta
                </p>
              </CardHeader>
              <CardContent>
                {!mfaSupported ? (
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">2FA niedostępne</p>
                      <p className="text-xs text-muted-foreground">
                        2FA nie jest dostępne w tej instancji. Upewnij się, że
                        MFA jest włączone w Supabase.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mfaEnrolled ? (
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-green-800">
                              2FA jest włączone
                            </p>
                            <p className="text-xs text-green-600">
                              Twoje konto jest chronione dwuskładnikowym
                              uwierzytelnianiem
                            </p>
                          </div>
                        </div>
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
                          Wyłącz 2FA
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                            <div>
                              <p className="text-sm font-medium text-yellow-800">
                                2FA wyłączone
                              </p>
                              <p className="text-xs text-yellow-600">
                                Twoje konto nie jest chronione dwuskładnikowym
                                uwierzytelnianiem
                              </p>
                            </div>
                          </div>
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
                                  "Zeskanuj kod QR i wpisz kod z aplikacji uwierzytelniającej.",
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
                        </div>

                        {(mfaQR || mfaSecret) && (
                          <div className="space-y-4 p-4 bg-muted rounded-lg">
                            <h4 className="text-sm font-medium">
                              Konfiguracja 2FA
                            </h4>
                            <div className="space-y-3">
                              {mfaQR && (
                                <div className="flex flex-col items-center gap-2">
                                  <p className="text-sm text-muted-foreground">
                                    Zeskanuj kod QR w aplikacji
                                    uwierzytelniającej:
                                  </p>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={mfaQR}
                                    alt="Kod QR 2FA"
                                    className="h-32 w-32 border rounded"
                                  />
                                </div>
                              )}
                              {mfaSecret && (
                                <div className="p-3 bg-background border rounded">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Lub wprowadź ten klucz ręcznie:
                                  </p>
                                  <code className="text-xs font-mono break-all">
                                    {mfaSecret}
                                  </code>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Kod z aplikacji"
                                  value={otpCode}
                                  onChange={(e) => setOtpCode(e.target.value)}
                                  className="max-w-[200px]"
                                />
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      if (!supabase) {
                                        toast.error(
                                          "Brak konfiguracji Supabase",
                                        )
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
                                      toast.success(
                                        "2FA zostało pomyślnie włączone!",
                                      )
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
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Zmiana hasła
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Zaktualizuj hasło do swojego konta
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
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
                  <Button
                    size="sm"
                    disabled={!password || !password2 || password !== password2}
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
                        toast.success("Hasło zostało pomyślnie zmienione", {
                          description:
                            "Możesz teraz używać nowego hasła do logowania",
                          icon: <CheckCircle className="h-4 w-4" />,
                        })
                      } catch {
                        toast.error("Nie udało się zmienić hasła")
                      }
                    }}
                  >
                    Zmień hasło
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Email */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email konta
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ten email służy do logowania i odzyskiwania konta. Nie jest
                  wyświetlany publicznie.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-w-md">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!accountEmail}
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
                        toast.success("Email został zaktualizowany", {
                          description:
                            "Sprawdź skrzynkę pocztową, aby potwierdzić nowy adres",
                          icon: <CheckCircle className="h-4 w-4" />,
                        })
                      } catch {
                        toast.error("Nie udało się zaktualizować emaila")
                      }
                    }}
                  >
                    Zapisz email
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* OAuth Connections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Połączenia OAuth
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Połącz dodatkowe metody logowania przez Google lub Discord
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
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
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Połączone:</span>
                    {identities.length ? (
                      <div className="flex gap-1">
                        {identities.map((i, index) => (
                          <Badge key={index} variant="secondary">
                            {i.provider}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">brak</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accessibility" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Preferencje wyświetlania
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Preferencje wyświetlania zapisywane lokalnie w przeglądarce
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 max-w-xl">
                  <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <div className="font-medium">Ogranicz animacje</div>
                      <div className="text-sm text-muted-foreground">
                        Zmniejsza ruchome animacje i przejścia dla lepszej
                        dostępności
                      </div>
                    </div>
                    <Switch
                      checked={reduceMotion}
                      onCheckedChange={(v) => {
                        setReduceMotion(v)
                        try {
                          localStorage.setItem(
                            "pref-reduce-motion",
                            v ? "1" : "0",
                          )
                        } catch {}
                        document.documentElement.classList.toggle(
                          "reduce-motion",
                          v,
                        )
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <div className="font-medium">Skala czcionki</div>
                      <div className="text-sm text-muted-foreground">
                        Powiększ lub zmniejsz bazowy rozmiar tekstu
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
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
                        className="w-24"
                      />
                      <div className="w-12 text-right text-sm font-medium">
                        {fontScale}%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="danger" className="space-y-6">
          <div className="grid gap-6">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  Usuń konto
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ta operacja jest nieodwracalna i usunie wszystkie Twoje dane
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-red-800">
                          Ostrzeżenie: Ta operacja jest nieodwracalna
                        </p>
                        <ul className="text-xs text-red-700 space-y-1">
                          <li>• Wszystkie Twoje posty zostaną usunięte</li>
                          <li>• Wszystkie interakcje zostaną usunięte</li>
                          <li>
                            • Wszystkie połączenia znajomych zostaną usunięte
                          </li>
                          <li>• Twój profil zostanie całkowicie usunięty</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (
                        !confirm(
                          "Czy na pewno chcesz usunąć swoje konto? Ta operacja jest nieodwracalna.",
                        )
                      ) {
                        return
                      }

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
                        await supabase
                          .from("posts")
                          .delete()
                          .eq("user_id", me.id)
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
                    className="w-full md:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Usuń moje konto
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ToggleSetting({
  field,
  label,
  description,
}: {
  field:
    | "enable_friend_requests"
    | "enable_mentions"
    | "enable_community_posts"
    | "enable_following_posts"
  label: string
  description?: string
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
    <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
      <div className="space-y-1">
        <div className="font-medium">{label}</div>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
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

import {
  subscribeToPush,
  unsubscribeFromPush,
  setupClientAudioBridge,
  ensureServiceWorkerReady,
} from "@/lib/push"

function PushControls() {
  const supabase = getSupabase()
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default",
  )
  const [endpoint, setEndpoint] = useState<string>("")
  const [testing, setTesting] = useState(false)
  const [swScope, setSwScope] = useState<string>("")
  const [swReady, setSwReady] = useState<boolean>(false)
  const vapidPresent =
    (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").length > 20
  const [audio] = useState(() =>
    typeof window !== "undefined"
      ? new Audio("/audio/tecza_powiadomienie.mp3")
      : (null as unknown as HTMLAudioElement),
  )

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

      // Probe current subscription endpoint
      try {
        const reg = await ensureServiceWorkerReady()
        const sub = await reg?.pushManager.getSubscription()
        setEndpoint(sub?.endpoint || "")
        if (reg) {
          setSwScope(reg.scope || "")
          setSwReady(true)
        }
      } catch {
        setEndpoint("")
        setSwScope("")
        setSwReady(false)
      }
      // Reflect current permission
      if (typeof window !== "undefined" && "Notification" in window) {
        setPermission(Notification.permission)
      }
    })()
  }, [supabase])

  useEffect(() => {
    if (!audio) return
    // Allow slightly louder notification but keep reasonable volume
    audio.volume = 0.7
    const cleanup = setupClientAudioBridge(() => {
      audio.currentTime = 0
      audio.play().catch(() => {})
    })
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
          if (!enabled) {
            const res = await subscribeToPush()
            if (!res.ok) {
              // rollback UI if failed
              setEnabled(false)
              const reason = res.reason || "nieznany błąd"
              try {
                const { toast } = await import("sonner")
                toast.error(`Nie udało się włączyć push: ${reason}`)
              } catch {}
              return
            }
            setEnabled(true)
            setPermission(
              (typeof window !== "undefined" && "Notification" in window
                ? Notification.permission
                : "default") as NotificationPermission,
            )
            setEndpoint(res.endpoint)
          } else {
            const res = await unsubscribeFromPush()
            if (!res.ok) return
            setEnabled(false)
            // Clear local endpoint
            setEndpoint("")
          }
        }}
      >
        {enabled ? "Wyłącz push" : "Włącz push"}
      </Button>
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        <div>
          Stan uprawnień: <span className="font-medium">{permission}</span>
        </div>
        <div>
          Service Worker:{" "}
          {swReady ? (
            <span className="font-medium">gotowy</span>
          ) : (
            <span className="italic">brak</span>
          )}
          {swScope ? (
            <span className="ml-1 break-all text-[11px]">({swScope})</span>
          ) : null}
        </div>
        <div>
          Klucz VAPID:{" "}
          {vapidPresent ? (
            <span className="font-medium">obecny</span>
          ) : (
            <span className="italic">brak</span>
          )}
        </div>
        <div className="break-all">
          Endpoint:{" "}
          {endpoint ? (
            <span className="text-[11px]">{endpoint}</span>
          ) : (
            <span className="italic">brak</span>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={testing || permission !== "granted" || !endpoint}
          onClick={async () => {
            setTesting(true)
            try {
              const session = (await supabase?.auth.getSession())?.data.session
              const token = session?.access_token
              const res = await fetch("/api/push", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  payload: {
                    title: "Tęcza.app",
                    body: "Test powiadomienia push",
                    url:
                      typeof window !== "undefined"
                        ? window.location.origin
                        : "/",
                  },
                }),
              })
              if (!res.ok) throw new Error(await res.text())
              toast.success("Wysłano test push")
            } catch (e) {
              const msg =
                e instanceof Error ? e.message : "Nie udało się wysłać testu"
              toast.error(msg)
            } finally {
              setTesting(false)
            }
          }}
        >
          Wyślij test
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={async () => {
            try {
              const reg = await ensureServiceWorkerReady()
              await reg?.update()
              toast.success("Zaktualizowano Service Workera")
            } catch (e) {
              const msg =
                e instanceof Error ? e.message : "Nie udało się odświeżyć SW"
              toast.error(msg)
            }
          }}
        >
          Odśwież SW
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={async () => {
            try {
              const unsub = await unsubscribeFromPush()
              if (!unsub.ok) throw new Error(unsub.reason || "błąd")
              const sub = await subscribeToPush()
              if (!sub.ok) throw new Error(sub.reason || "błąd")
              setEndpoint(sub.endpoint)
              setEnabled(true)
              toast.success("Odświeżono subskrypcję push")
            } catch (e) {
              const msg =
                e instanceof Error
                  ? e.message
                  : "Nie udało się odświeżyć subskrypcji"
              toast.error(msg)
            }
          }}
        >
          Odśwież subskrypcję
        </Button>
      </div>
    </div>
  )
}
