"use client"

import { useParams } from "next/navigation"
import { CommunityWiki } from "@/components/dashboard/community-wiki"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Page(_props: {
  params: Promise<{ id: string }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  searchParams?: Promise<any>
}) {
  const params = useParams<{ id: string }>()
  const id = (params?.id as string) || ""
  return (
    <section className="container py-6">
      <CommunityWiki communityId={id} communitySlugOrId={id} isEditor={false} />
    </section>
  )
}
