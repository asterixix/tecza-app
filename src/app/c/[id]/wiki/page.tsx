"use client"
import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function DeprecatedWikiPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  useEffect(() => {
    const id = params?.id
    if (id) router.replace(`/c/${id}`)
  }, [params, router])

  return null
}
