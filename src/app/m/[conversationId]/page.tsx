import { MessageConversation } from "./message-conversation"

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  return <MessageConversation conversationId={conversationId} />
}
