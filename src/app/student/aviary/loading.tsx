import { cn } from "cn"

function Bar({ className }: { className: string }) {
  return <span className={cn("block rounded-sm bg-surface-sunken motion-safe:animate-pulse", className)} />
}

export default function Loading() {
  return (
    <div className="dub flex flex-1 flex-col bg-surface">
      <div
        aria-busy="true"
        className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 pt-10 pb-20 sm:px-8 sm:pt-14"
      >
        <div className="flex flex-col gap-3">
          <Bar className="h-9 w-40" />
          <Bar className="h-5 w-96 max-w-full" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="h-[460px] rounded-xl border border-outline" />
          <div className="h-[460px] rounded-xl border border-outline" />
        </div>
      </div>
    </div>
  )
}
