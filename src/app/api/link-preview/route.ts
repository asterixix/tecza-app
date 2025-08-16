/* OpenGraph API support route - do link preview w feedzie */

export const runtime = "nodejs"

function extractMeta(html: string, key: string) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"]+)["'][^>]*>`,
    "i",
  )
  const m = html.match(re)
  return m ? m[1] : undefined
}

function extractTitle(html: string) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return m ? m[1].trim() : undefined
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const url = searchParams.get("url")
    if (!url)
      return new Response(JSON.stringify({ error: "Missing url" }), {
        status: 400,
      })
    // Walidacja URL
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      return new Response(JSON.stringify({ error: "Invalid url" }), {
        status: 400,
      })
    }

    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), 7000)
    const res = await fetch(parsed.toString(), {
      signal: ac.signal,
      headers: { "User-Agent": "tecza-app-linkpreview/1.0" },
    })
    clearTimeout(t)
    if (!res.ok)
      return new Response(
        JSON.stringify({ error: "Fetch failed", status: res.status }),
        {
          status: 502,
        },
      )
    const html = await res.text()

    const meta = {
      url: parsed.toString(),
      siteName: extractMeta(html, "og:site_name") || parsed.hostname,
      title:
        extractMeta(html, "og:title") || extractTitle(html) || parsed.hostname,
      description:
        extractMeta(html, "og:description") || extractMeta(html, "description"),
      image:
        extractMeta(html, "og:image") || extractMeta(html, "twitter:image"),
    }
    return new Response(JSON.stringify(meta), {
      headers: { "content-type": "application/json" },
    })
  } catch {
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
    })
  }
}
