import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const store = await cookies()
  const token = store.get("sb-access-token")?.value
  if (!token)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const edgeUrl = `${base.replace(/\/$/, "")}/functions/v1/web-push`
  const resp = await fetch(edgeUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body || {}),
  })

  const text = await resp.text()
  return new NextResponse(text, {
    status: resp.status,
    headers: { "Content-Type": "application/json" },
  })
}
