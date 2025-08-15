import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return NextResponse.json({ ok: false, error: "Missing Supabase env" }, { status: 500 });
    const edgeUrl = `${url}/functions/v1/video-transcode`;
    const res = await fetch(edgeUrl, { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${anon}` }, body: JSON.stringify(body) });
    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
