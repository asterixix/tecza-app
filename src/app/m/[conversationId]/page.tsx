import type { Metadata } from "next"
import { MessageConversation } from "./message-conversation"

export const metadata: Metadata = {
  title: "Wiadomości | Tęcza.app",
  description: "Prywatne wiadomości",
}

export default async function MessagePage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  return <MessageConversation conversationId={conversationId} />
}
