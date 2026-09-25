import { ArrowRight, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Page() {
  const variants = ["primary", "secondary", "ghost", "destructive", "danger", "link"] as const
  return (
    <div className="dub min-h-screen bg-surface p-10">
      <div className="flex flex-col gap-6">
        {variants.map((v) => (
          <div key={v} className="flex flex-wrap items-center gap-3" data-row={v}>
            <Button variant={v}><Plus aria-hidden />Create task</Button>
            <Button variant={v} shortcut="N">New event</Button>
            <Button variant={v} size="sm">Small<ArrowRight aria-hidden /></Button>
            <Button variant={v} loading><Plus aria-hidden />Saving</Button>
            <Button variant={v} disabled>Disabled</Button>
            <Button variant={v} size="icon" aria-label="Delete"><Trash2 aria-hidden /></Button>
          </div>
        ))}
        <div className="flex gap-3 rounded-xl bg-surface-inverse p-2 w-fit">
          <Button variant="inverse" size="sm"><X aria-hidden />Clear</Button>
          <Button variant="inverse" size="sm"><Trash2 aria-hidden />Delete</Button>
        </div>
      </div>
    </div>
  )
}
