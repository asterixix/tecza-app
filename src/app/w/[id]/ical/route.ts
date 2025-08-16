export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const url = new URL(req.url)
  const host = `${url.protocol}//${url.host}`

  // Minimal placeholder ICS (improve by querying DB via server client in next iteration)
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Tecza.app//Events//PL\nBEGIN:VEVENT\nUID:${id}@tecza.app\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "Z")}\nSUMMARY:Wydarzenie Tęcza\nURL:${host}/events/${id}\nEND:VEVENT\nEND:VCALENDAR\n`

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename=event-${id}.ics`,
    },
  })
}
