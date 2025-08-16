"use client"

import { useEffect, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getSupabase } from "@/lib/supabase-browser"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

const schema = z.object({
  pronouns: z.string().max(30).optional().or(z.literal("")),
  city: z.string().max(50).optional().or(z.literal("")),
  country: z.string().max(50).optional().or(z.literal("")),
  bio: z.string().max(280).optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
})

type FormValues = z.infer<typeof schema>

export default function ProfileOnboardingPage() {
  const supabase = getSupabase()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { pronouns: "", city: "", country: "", bio: "", website: "" },
    mode: "onBlur",
  })

  useEffect(() => {
    if (!supabase) return
    ;(async () => {
      const { data: u } = await supabase.auth.getUser()
      if (!u.user) {
        window.location.href = "/l"
        return
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, onboarded_at, pronouns, city, country, bio, website, username, display_name")
        .eq("id", u.user.id).single()
      if (!profile) { window.location.href = "/onboarding/account"; return }
      form.reset({ pronouns: profile.pronouns ?? "", city: profile.city ?? "", country: profile.country ?? "", bio: profile.bio ?? "", website: profile.website ?? "" })
    setLoading(false)
    })()
  }, [supabase, form])

  async function onSubmit(values: FormValues) {
    if (!supabase) return
    setSubmitting(true)
    try {
      const { data: u } = await supabase.auth.getUser(); if (!u.user) throw new Error("Brak sesji")
      const { error } = await supabase.from("profiles").update({ ...values, onboarded_at: new Date().toISOString() }).eq("id", u.user.id)
      if (error) throw error
      window.location.href = "/onboarding/intro"
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nie udało się zapisać")
    } finally { setSubmitting(false) }
  }

  if (loading) return null

  return (
    <div className="mx-auto max-w-md px-4 md:px-6 py-10 md:py-14">
      <Toaster richColors position="top-center" />
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold">Ustaw profil</h1>
          <p className="mt-1 text-muted-foreground">Możesz pominąć — ustawisz wszystko później w profilu.</p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 grid gap-3">
              <FormField name="pronouns" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Zaimki (np. ona/jej, on/jego)</FormLabel>
                  <FormControl><Input placeholder="np. ona/jej" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="city" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Miasto</FormLabel>
                  <FormControl><Input placeholder="np. Warszawa" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="country" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Kraj</FormLabel>
                  <FormControl><Input placeholder="np. Polska" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="website" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Strona WWW</FormLabel>
                  <FormControl><Input type="url" placeholder="https://twoja-strona.pl" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="bio" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl><Textarea rows={4} placeholder="Krótki opis o Tobie" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>Zapisz i kontynuuj</Button>
                <Button type="button" variant="ghost" onClick={() => { window.location.href = "/onboarding/intro" }}>Pomiń</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
