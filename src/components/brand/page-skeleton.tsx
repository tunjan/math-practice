import { Page } from "@/components/brand/primitives"
import { Card } from "@/components/ui/card"

function Bar({ className }: { className: string }) {
  return <span className={`block rounded-xs bg-outline motion-safe:animate-pulse ${className}`} />
}

/** Loading shape for a workspace page: heading, then a card of rows. */
export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Page aria-busy="true" aria-label="Loading">
      <div className="flex flex-col gap-3 py-1">
        <Bar className="h-7 w-56" />
        <Bar className="h-4 w-80 max-w-full" />
      </div>
      <Card>
        <div className="h-16 border-b border-outline px-6 py-5">
          <Bar className="h-5 w-40" />
        </div>
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="flex h-14 items-center justify-between gap-6 border-t border-outline px-6 first:border-t-0"
          >
            <div className="flex flex-col gap-2">
              <Bar className="h-3.5 w-64 max-w-[50vw]" />
              <Bar className="h-3 w-32" />
            </div>
            <Bar className="h-5 w-20" />
          </div>
        ))}
      </Card>
    </Page>
  )
}

/** Loading shape for the student's board: heading, then five columns. */
export function BoardSkeleton() {
  return (
    <Page width="wide" aria-busy="true" aria-label="Loading">
      <div className="flex flex-col gap-3 py-1">
        <Bar className="h-7 w-56" />
        <Bar className="h-4 w-80 max-w-full" />
      </div>
      <div className="-mx-4 overflow-hidden px-4 md:-mx-8 md:px-8">
        <div className="grid min-w-min auto-cols-[min(20rem,calc(100vw-4.5rem))] grid-flow-col gap-3 md:auto-cols-[minmax(13rem,1fr)]">
          {[2, 1, 1, 0, 2].map((cards, i) => (
            <div key={i} className="flex min-h-72 flex-col gap-2 rounded-xl border border-outline bg-surface-muted p-2">
              <div className="flex flex-col gap-2 px-2 pt-1.5 pb-2">
                <Bar className="h-4 w-24" />
                <Bar className="h-3 w-32" />
              </div>
              {Array.from({ length: cards }, (_, j) => (
                <div key={j} className="flex h-28 flex-col gap-2 rounded-md border border-outline bg-surface p-3.5">
                  <Bar className="h-3 w-20" />
                  <Bar className="h-3.5 w-full" />
                  <Bar className="h-3.5 w-2/3" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Page>
  )
}

/** Loading shape for the calendar, in its ruled Dub column. */
export function CalendarSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="dub flex flex-1 flex-col bg-surface">
      <div className="border-b border-outline">
        <div className="mx-auto flex h-12 w-full max-w-screen-xl items-center justify-between px-3 sm:h-16 lg:px-6">
          <Bar className="h-6 w-24 bg-surface-sunken" />
          <Bar className="h-9 w-32 rounded-lg bg-surface-sunken sm:h-10" />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-4 px-3 pt-5 lg:px-6">
        <div className="flex items-center gap-2">
          <Bar className="h-10 w-16 rounded-lg bg-surface-sunken" />
          <Bar className="h-10 w-20 rounded-lg bg-surface-sunken" />
          <Bar className="ml-2 h-5 w-36 bg-surface-sunken" />
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-xl border border-outline">
            <div className="h-8 border-b border-outline" />
            {Array.from({ length: 5 }, (_, week) => (
              <div key={week} className="grid grid-cols-7 border-b border-outline last:border-b-0">
                {Array.from({ length: 7 }, (_, day) => (
                  <div key={day} className="min-h-14 border-l border-outline p-1.5 first:border-l-0 md:min-h-28">
                    <Bar className="size-5 rounded-full bg-surface-sunken" />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-xl border border-outline">
            <div className="flex h-12 items-center border-b border-outline px-4">
              <Bar className="h-4 w-40 bg-surface-sunken" />
            </div>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex gap-3 border-b border-outline px-4 py-3 last:border-b-0">
                <Bar className="h-4 w-12 bg-surface-sunken" />
                <div className="flex flex-1 flex-col gap-2">
                  <Bar className="h-4 w-full bg-surface-sunken" />
                  <Bar className="h-3 w-2/3 bg-surface-sunken" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
