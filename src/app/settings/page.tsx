"use client"

import { useEffect, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const schema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/i, "Tylko litery, cyfry i _"),
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
  profile_visibility: z.enum(["public","friends","private"]),
  show_location: z.boolean(),
  show_orientation: z.boolean(),
  show_friends: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

export default function SettingsPage() {
  const supabase = getSupabase()
  const [loading, setLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [tag, setTag] = useState<number | null>(null)
  // Security state
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")
  const [mfaSupported, setMfaSupported] = useState(false)
  const [mfaEnrolled, setMfaEnrolled] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [mfaQR, setMfaQR] = useState<string>("")
  const [mfaSecret, setMfaSecret] = useState<string>("")
  const [otpCode, setOtpCode] = useState("")
  // OAuth state
  const [identities, setIdentities] = useState<Array<{ id?: string; provider?: string }>>([])
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
        const ids = (user.identities as Array<{ id?: string; provider?: string }>) || []
        setIdentities(ids)
      } catch {}
      const { data } = await supabase
        .from("profiles")
        .select("username,tag,display_name,bio,pronouns,sexual_orientation,gender_identity,email,website,social_links,city,country,profile_visibility,show_location,show_orientation,avatar_url,cover_image_url,show_friends")
        .eq("id", user.id)
        .maybeSingle()
      if (data) {
        const socials = (data.social_links || {}) as Record<string,string>
        form.reset({
          username: data.username || "",
          display_name: data.display_name || "",
          bio: data.bio || "",
          pronouns: data.pronouns || "",
          sexual_orientation: (data.sexual_orientation as string[] | null) || [],
          gender_identity: (data.gender_identity as string[] | null) || [],
          email: data.email || "",
          website: data.website || "",
          instagram: socials.instagram || "",
          twitter: socials.twitter || "",
          tiktok: socials.tiktok || "",
          city: data.city || "",
          country: data.country || "Poland",
          profile_visibility: (data.profile_visibility as "public"|"friends"|"private") || "public",
          show_location: !!data.show_location,
          show_orientation: !!data.show_orientation,
          show_friends: (data as { show_friends?: boolean }).show_friends ?? true,
        })
  setTag((data as { tag?: number }).tag ?? null)
      }
      // MFA capability and status
      try {
        if (supabase.auth.mfa) {
          setMfaSupported(true)
          const res = await supabase.auth.mfa.listFactors?.()
          const enrolled: Array<{ id: string; factor_type?: string }> = (res?.data?.all as Array<{ id: string; factor_type?: string }>) ?? []
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

      const social_links = {
        instagram: values.instagram || undefined,
        twitter: values.twitter || undefined,
        tiktok: values.tiktok || undefined,
      }

      // Optional uploads to Supabase Storage
      let avatar_url: string | undefined
      let cover_image_url: string | undefined
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() || "jpg"
        const path = `${user.id}/avatar-${Date.now()}.${ext}`
        const { data: up, error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true })
        if (!upErr) {
          const { data: pub } = await supabase.storage.from("avatars").getPublicUrl(up.path)
          avatar_url = pub?.publicUrl
        }
      }
      if (coverFile) {
        const ext = coverFile.name.split(".").pop() || "jpg"
        const path = `${user.id}/cover-${Date.now()}.${ext}`
        const { data: up, error: upErr } = await supabase.storage.from("covers").upload(path, coverFile, { upsert: true })
        if (!upErr) {
          const { data: pub } = await supabase.storage.from("covers").getPublicUrl(up.path)
          cover_image_url = pub?.publicUrl
        }
      }

  const { error } = await supabase.from("profiles").update({
        display_name: values.display_name,
        bio: values.bio,
        pronouns: values.pronouns,
        sexual_orientation: values.sexual_orientation,
        gender_identity: values.gender_identity,
        email: values.email,
        website: values.website,
        social_links,
        city: values.city,
        country: values.country,
        profile_visibility: values.profile_visibility,
        show_location: values.show_location,
        show_orientation: values.show_orientation,
        show_friends: values.show_friends ?? true,
        ...(avatar_url ? { avatar_url } : {}),
        ...(cover_image_url ? { cover_image_url } : {}),
        updated_at: new Date().toISOString(),
      }).eq("id", user.id)
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
      <Tabs defaultValue="profile">
        <TabsList className="mb-4 flex flex-wrap gap-2">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="privacy">Prywatność</TabsTrigger>
          <TabsTrigger value="security">Bezpieczeństwo</TabsTrigger>
          <TabsTrigger value="accessibility">Dostępność</TabsTrigger>
          <TabsTrigger value="danger">Strefa ryzyka</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardContent className="p-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="username" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwa użytkownika</FormLabel>
                    <FormControl><Input placeholder="nazwa" value={field.value} readOnly aria-readonly /></FormControl>
                    <p className="text-xs text-muted-foreground">Stała nazwa użytkownika ustalana przy rejestracji. Nie można zmienić.</p>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormItem>
                  <FormLabel>Tag</FormLabel>
                  <FormControl><Input placeholder="1234" value={tag ?? ""} readOnly aria-readonly /></FormControl>
                  <p className="text-xs text-muted-foreground">Twój unikalny tag. Nie można zmienić.</p>
                </FormItem>
        <FormField control={form.control} name="display_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wyświetlana nazwa</FormLabel>
          <FormControl><Input placeholder="Twoje imię/pseudonim" value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

        <FormField control={form.control} name="bio" render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl><Textarea rows={4} placeholder="Krótko o Tobie" value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid md:grid-cols-2 gap-4">
        <FormField control={form.control} name="pronouns" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zaimki</FormLabel>
          <FormControl><Input placeholder="np. ona/jej, on/jego, they/them" value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="profile_visibility" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Widoczność profilu</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Publiczny" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Publiczny</SelectItem>
                        <SelectItem value="friends">Tylko znajomi</SelectItem>
                        <SelectItem value="private">Prywatny</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
        <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Miasto</FormLabel>
          <FormControl><Input placeholder="np. Warszawa" value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
        <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kraj</FormLabel>
          <FormControl><Input placeholder="np. Poland" value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
        <FormField control={form.control} name="website" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Strona www</FormLabel>
          <FormControl><Input placeholder="https://..." value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
        <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (publiczny)</FormLabel>
          <FormControl><Input type="email" placeholder="you@example.com" value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Obrazy profilu */}
              <div className="grid md:grid-cols-2 gap-4">
                <FormItem>
                  <FormLabel>Avatar</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      if (file && file.size > 2 * 1024 * 1024) { // 2MB
                        toast.error("Avatar jest zbyt duży (max 2MB)")
                        return
                      }
                      setAvatarFile(file)
                    }} />
                  </FormControl>
          {avatarFile && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Podgląd:
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Podgląd avatara" src={URL.createObjectURL(avatarFile)} className="mt-1 h-16 w-16 rounded-full object-cover border" />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
                <FormItem>
                  <FormLabel>Obraz tła</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      if (file && file.size > 5 * 1024 * 1024) { // 5MB
                        toast.error("Obraz tła jest zbyt duży (max 5MB)")
                        return
                      }
                      setCoverFile(file)
                    }} />
                  </FormControl>
          {coverFile && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Podgląd:
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Podgląd tła" src={URL.createObjectURL(coverFile)} className="mt-1 h-20 w-full max-w-sm rounded object-cover border" />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
        <FormField control={form.control} name="instagram" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
          <FormControl><Input placeholder="https://instagram.com/..." value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
        <FormField control={form.control} name="twitter" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twitter/X</FormLabel>
          <FormControl><Input placeholder="https://twitter.com/..." value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
        <FormField control={form.control} name="tiktok" render={({ field }) => (
                  <FormItem>
                    <FormLabel>TikTok</FormLabel>
          <FormControl><Input placeholder="https://tiktok.com/@..." value={field.value ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="show_location" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <FormLabel className="m-0">Pokazuj lokalizację</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="show_orientation" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <FormLabel className="m-0">Pokazuj orientację/tożsamość</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="show_friends" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <FormLabel className="m-0">Pokazuj listę znajomych</FormLabel>
                    <FormControl><Switch checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="submit" disabled={loading}>{loading ? "Zapisywanie…" : "Zapisz"}</Button>
                <Button type="button" variant="outline" onClick={async () => {
                  if (!supabase) return
                  const me = (await supabase.auth.getUser()).data.user
                  if (!me) return
                  const { data } = await supabase.from("profiles").select("username").eq("id", me.id).maybeSingle()
                  const uname = data?.username || ""
                  window.location.href = uname ? `/u/${uname}` : "/"
                }}>Podgląd</Button>
              </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardContent className="p-4 grid gap-4">
              <Form {...form}>
                <p className="text-sm text-muted-foreground">Ustaw widoczność profilu i elementów widocznych publicznie.</p>
                {/* Reuse existing privacy toggles by rendering the same fields here for quick access */}
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="profile_visibility" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Widoczność profilu</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Publiczny" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Publiczny</SelectItem>
                          <SelectItem value="friends">Tylko znajomi</SelectItem>
                          <SelectItem value="private">Prywatny</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="show_location" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-3">
                      <FormLabel className="m-0">Pokazuj lokalizację</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="show_orientation" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-3">
                      <FormLabel className="m-0">Pokazuj orientację/tożsamość</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="show_friends" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-3">
                      <FormLabel className="m-0">Pokazuj listę znajomych</FormLabel>
                      <FormControl><Switch checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div>
                  <Button onClick={form.handleSubmit(onSubmit)} disabled={loading}>{loading ? "Zapisywanie…" : "Zapisz prywatność"}</Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid gap-4">
            <Card>
              <CardContent className="p-4 grid gap-3">
                <h2 className="text-lg font-semibold">2FA (TOTP)</h2>
                {!mfaSupported ? (
                  <p className="text-sm text-muted-foreground">2FA nie jest dostępne w tej instancji. Upewnij się, że MFA jest włączone w Supabase.</p>
                ) : (
                  <div className="grid gap-3">
                    {mfaEnrolled ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">2FA jest włączone.</span>
                        <Button variant="outline" size="sm" onClick={async () => {
                          try {
              if (!supabase) { toast.error("Brak konfiguracji Supabase"); return }
                            if (!mfaFactorId) return
                            await supabase.auth.mfa.unenroll({ factorId: mfaFactorId })
                            setMfaEnrolled(false)
                            setMfaFactorId(null)
                            toast.success("Wyłączono 2FA")
                          } catch {
                            toast.error("Nie udało się wyłączyć 2FA")
                          }
                        }}>Wyłącz</Button>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        <Button size="sm" onClick={async () => {
                          try {
              if (!supabase) { toast.error("Brak konfiguracji Supabase"); return }
                            const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" })
                            if (error) throw error
                            const { id, totp } = data || {}
                            setMfaFactorId(id || null)
                            setMfaQR(totp?.qr_code || "")
                            setMfaSecret(totp?.secret || "")
                            toast.message("Zeskanuj kod i wpisz kod z aplikacji.")
                          } catch {
                            toast.error("Nie udało się rozpocząć rejestracji 2FA")
                          }
                        }}>Włącz 2FA</Button>
                        {(mfaQR || mfaSecret) && (
                          <div className="grid gap-2">
                            {mfaQR && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={mfaQR} alt="Kod QR 2FA" className="h-40 w-40" />
                            )}
                            {mfaSecret && <p className="text-xs text-muted-foreground">Sekret: {mfaSecret}</p>}
                            <div className="flex items-center gap-2">
                              <Input placeholder="Kod z aplikacji" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} className="max-w-[160px]" />
                              <Button size="sm" onClick={async () => {
                                try {
                  if (!supabase) { toast.error("Brak konfiguracji Supabase"); return }
                                  if (!mfaFactorId || !otpCode) return
                                  const ch = await supabase.auth.mfa.challenge({ factorId: mfaFactorId })
                                  const challengeId = (ch?.data as { id?: string } | undefined)?.id
                                  if (!challengeId) throw new Error("Brak identyfikatora wyzwania 2FA")
                                  const { error: verr } = await supabase.auth.mfa.verify({ factorId: mfaFactorId, code: otpCode, challengeId })
                                  if (verr) throw verr
                                  setMfaEnrolled(true)
                                  setMfaQR("")
                                  setMfaSecret("")
                                  setOtpCode("")
                                  toast.success("2FA włączone")
                                } catch {
                                  toast.error("Nie udało się zweryfikować kodu 2FA")
                                }
                              }}>Zatwierdź</Button>
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
                  <Input type="password" placeholder="Nowe hasło" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <Input type="password" placeholder="Powtórz hasło" value={password2} onChange={(e) => setPassword2(e.target.value)} />
                </div>
                <div>
          <Button size="sm" onClick={async () => {
                    try {
            if (!supabase) { toast.error("Brak konfiguracji Supabase"); return }
                      if (!password || password !== password2) {
                        toast.error("Hasła nie są zgodne")
                        return
                      }
                      const { error } = await supabase.auth.updateUser({ password })
                      if (error) throw error
                      setPassword("")
                      setPassword2("")
                      toast.success("Hasło zmienione")
                    } catch {
                      toast.error("Nie udało się zmienić hasła")
                    }
                  }}>Zapisz hasło</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 grid gap-3">
                <h2 className="text-lg font-semibold">Email konta (prywatny)</h2>
                <div className="grid md:grid-cols-2 gap-2 max-w-lg">
                  <Input type="email" placeholder="you@example.com" value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} />
                  <Button size="sm" variant="outline" onClick={async () => {
                    try {
                      if (!supabase) { toast.error("Brak konfiguracji Supabase"); return }
                      const { error } = await supabase.auth.updateUser({ email: accountEmail })
                      if (error) throw error
                      toast.success("Zaktualizowano email. Sprawdź skrzynkę, aby potwierdzić.")
                    } catch {
                      toast.error("Nie udało się zaktualizować emaila")
                    }
                  }}>Zapisz email</Button>
                </div>
                <p className="text-sm text-muted-foreground">Ten email służy do logowania i odzyskiwania konta. Nie jest wyświetlany publicznie.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 grid gap-3">
                <h2 className="text-lg font-semibold">Połączenia OAuth</h2>
                <div className="text-sm text-muted-foreground">Połącz dodatkowe logowanie przez Google lub Discord.</div>
                <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={async () => {
                    try {
            if (!supabase) { toast.error("Brak konfiguracji Supabase"); return }
                      const { data, error } = await supabase.auth.linkIdentity({ provider: "google", options: { redirectTo: `${window.location.origin}/settings` } })
                      if (error) throw error
                      if (data?.url) window.location.href = data.url
                    } catch {
                      toast.error("Nie udało się zainicjować połączenia Google")
                    }
                  }}>Połącz Google</Button>
          <Button variant="outline" size="sm" onClick={async () => {
                    try {
            if (!supabase) { toast.error("Brak konfiguracji Supabase"); return }
                      const { data, error } = await supabase.auth.linkIdentity({ provider: "discord", options: { redirectTo: `${window.location.origin}/settings` } })
                      if (error) throw error
                      if (data?.url) window.location.href = data.url
                    } catch {
                      toast.error("Nie udało się zainicjować połączenia Discord")
                    }
                  }}>Połącz Discord</Button>
                </div>
                <div className="text-sm">Połączone: {identities.length ? identities.map((i) => i.provider).join(", ") : "brak"}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accessibility">
          <Card>
            <CardContent className="p-4 grid gap-3 max-w-xl">
              <p className="text-sm text-muted-foreground">Preferencje wyświetlania zapisywane lokalnie w przeglądarce.</p>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="font-medium">Ogranicz animacje</div>
                  <div className="text-sm text-muted-foreground">Zmniejsza ruchome animacje i przejścia.</div>
                </div>
                <Switch checked={reduceMotion} onCheckedChange={(v) => {
                  setReduceMotion(v)
                  try { localStorage.setItem("pref-reduce-motion", v ? "1" : "0") } catch {}
                  document.documentElement.classList.toggle("reduce-motion", v)
                }} />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3 gap-3">
                <div>
                  <div className="font-medium">Skala czcionki</div>
                  <div className="text-sm text-muted-foreground">Powiększ lub zmniejsz bazowy rozmiar tekstu.</div>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="range" min={90} max={130} step={5} value={fontScale} onChange={(e) => {
                    const v = e.target.value
                    setFontScale(v)
                    try { localStorage.setItem("pref-font-scale", v) } catch {}
                    document.documentElement.style.setProperty("--app-font-scale", `${v}%`)
                  }} />
                  <div className="w-14 text-right text-sm text-muted-foreground">{fontScale}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card>
            <CardContent className="p-4 grid gap-3">
              <h2 className="text-lg font-semibold text-red-600">Usuń konto</h2>
              <p className="text-sm text-muted-foreground">To usunie Twoje posty, interakcje i połączenia. Tej operacji nie można cofnąć.</p>
        <Button variant="destructive" onClick={async () => {
                try {
          if (!supabase) { toast.error("Brak konfiguracji Supabase"); return }
                  const me = (await supabase.auth.getUser()).data.user
                  if (!me) throw new Error("Brak użytkownika")
                  // Best effort client-side cleanup under RLS
                  await supabase.from("post_interactions").delete().eq("user_id", me.id)
                  await supabase.from("posts").delete().eq("user_id", me.id)
                  await supabase.from("friend_requests").delete().or(`sender_id.eq.${me.id},receiver_id.eq.${me.id}`)
                  await supabase.from("friendships").delete().or(`user1_id.eq.${me.id},user2_id.eq.${me.id}`)
                  await supabase.from("profiles").delete().eq("id", me.id)
                  // Sign out after cleanup
                  await supabase.auth.signOut()
                  window.location.href = "/"
                } catch {
                  toast.error("Nie udało się usunąć konta. Skontaktuj się ze wsparciem.")
                }
              }}>Usuń moje konto</Button>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
