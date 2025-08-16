// Legacy route moved to /m/[conversationId]
import { redirect } from "next/navigation"

export default async function LegacyMessages({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  redirect(`/m/${conversationId}`)
}
