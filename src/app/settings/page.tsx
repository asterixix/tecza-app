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
      const { data } = await supabase
        .from("profiles")
        .select("username,display_name,bio,pronouns,sexual_orientation,gender_identity,email,website,social_links,city,country,profile_visibility,show_location,show_orientation,avatar_url,cover_image_url,show_friends")
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
        username: values.username,
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
    <div className="mx-auto max-w-2xl px-4 md:px-6 py-6">
      <h1 className="text-2xl font-bold tracking-tight mb-4">Ustawienia profilu</h1>
      <Card>
        <CardContent className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField control={form.control} name="username" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nazwa użytkownika</FormLabel>
                    <FormControl><Input placeholder="nazwa" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
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
    </div>
  )
}
