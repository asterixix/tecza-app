"use client"

import { useCallback, useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase-browser"

const ALL_ROLES = [
  "user",
  "company",
  "user-supporter",
  "company-supporter",
  "early-tester",
  "tester",
  "moderator",
  "administrator",
  "super-administrator",
]

// Badge catalog aligned with profile UI
const ALL_BADGES = [
  "user-supporter",
  "company-supporter",
  "early-tester",
  "tester",
  "moderator",
  "administrator",
  "super-administrator",
  "ambassador",
  "company",
  "banned",
  "tecza-team",
  "pride2026",
  "hiv-positive-campaigh",
  "1-anniversary",
  "3-anniversary",
  "5-anniversary",
  "10-anniversary",
]

export default function RolesAdmin() {
  const supabase = getSupabase()
  const [allowed, setAllowed] = useState(false)
  const [query, setQuery] = useState("")
  const [list, setList] = useState<
    Array<{
      id: string
      username: string | null
      roles: string[]
      badges: string[]
    }>
  >([])

  const refresh = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase
      .from("profiles")
      .select("id,username,roles,badges")
      .order("username")
    const typed =
      (data as Array<{
        id: string
        username: string | null
        roles: string[] | null
        badges: string[] | null
      }> | null) || []
    setList(
      typed.map((r) => ({
        id: r.id,
        username: r.username,
        roles: r.roles || [],
        badges: r.badges || [],
      })),
    )
  }, [supabase])

  useEffect(() => {
    ;(async () => {
      if (!supabase) return
      const { data } = await supabase.auth.getUser()
      const u = data.user
      if (!u) return
      const { data: prof } = await supabase
        .from("profiles")
        .select("roles")
        .eq("id", u.id)
        .maybeSingle()
      const roles = (prof?.roles as string[] | undefined) || []
      const ok = roles.some((r) =>
        ["administrator", "super-administrator"].includes(r),
      )
      setAllowed(ok)
      if (!ok) return
      await refresh()
    })()
  }, [supabase, refresh])

  async function toggleRole(userId: string, role: string) {
    if (!supabase) return
    const row = list.find((x) => x.id === userId)
    if (!row) return
    const next = new Set(row.roles || [])
    if (next.has(role)) next.delete(role)
    else next.add(role)
    const nextArr = Array.from(next)
    const { error } = await supabase.rpc("admin_set_roles", {
      p_user_id: userId,
      p_roles: nextArr,
    })
    if (!error)
      setList(list.map((x) => (x.id === userId ? { ...x, roles: nextArr } : x)))
  }

  async function toggleBadge(userId: string, badge: string) {
    if (!supabase) return
    const row = list.find((x) => x.id === userId)
    if (!row) return
    const next = new Set(row.badges || [])
    if (next.has(badge)) next.delete(badge)
    else next.add(badge)
    const nextArr = Array.from(next)
    const { error } = await supabase.rpc("admin_set_badges", {
      p_user_id: userId,
      p_badges: nextArr,
    })
    if (!error)
      setList(
        list.map((x) => (x.id === userId ? { ...x, badges: nextArr } : x)),
      )
  }

  if (!allowed) return null

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
      <h1 className="text-2xl font-semibold mb-4">Role użytkowników</h1>
      <div className="mb-4">
        <input
          className="w-full max-w-sm rounded-md border px-3 py-2"
          placeholder="Szukaj użytkownika"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-2">Użytkownik</th>
              {ALL_ROLES.map((r) => (
                <th key={r} className="text-left p-2 whitespace-nowrap">
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list
              .filter(
                (x) =>
                  !query ||
                  (x.username || "")
                    .toLowerCase()
                    .includes(query.toLowerCase()),
              )
              .map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-2 font-medium">
                    {u.username || u.id.slice(0, 8)}
                    {u.username ? "" : "…"}
                  </td>
                  {ALL_ROLES.map((r) => {
                    const checked = (u.roles || []).includes(r)
                    return (
                      <td key={r} className="p-2">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRole(u.id, r)}
                          />
                          <span className="sr-only">{r}</span>
                        </label>
                      </td>
                    )
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4">Odznaki użytkowników</h2>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-2">Użytkownik</th>
              {ALL_BADGES.map((b) => (
                <th key={b} className="text-left p-2 whitespace-nowrap">
                  {b}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list
              .filter(
                (x) =>
                  !query ||
                  (x.username || "")
                    .toLowerCase()
                    .includes(query.toLowerCase()),
              )
              .map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-2 font-medium">
                    {u.username || u.id.slice(0, 8)}
                    {u.username ? "" : "…"}
                  </td>
                  {ALL_BADGES.map((b) => {
                    const checked = (u.badges || []).includes(b)
                    return (
                      <td key={b} className="p-2">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleBadge(u.id, b)}
                          />
                          <span className="sr-only">{b}</span>
                        </label>
                      </td>
                    )
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
