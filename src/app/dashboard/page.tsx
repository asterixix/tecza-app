import { PostComposer } from "@/components/dashboard/post-composer"
import { Feed } from "@/components/dashboard/feed"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 md:px-6 py-8 space-y-6">
      <div>
        <Badge variant="secondary">Twój pulpit</Badge>
        <h1 className="text-2xl font-bold tracking-tight mt-2">Nowe posty i publikowanie</h1>
        <p className="text-muted-foreground">Dodawaj posty z Markdown, wybieraj widoczność i przeglądaj feed.</p>
      </div>
  <PostComposer />
      <Separator />
      <Feed />
    </div>
  )
}
