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
    <div className="dub flex flex-1 flex-col bg-surface">
      <div
        aria-busy="true"
        aria-label="Loading"
        className="flex w-full max-w-[1320px] flex-1 flex-col border-outline min-[1320px]:border-r"
      >
        <div className="flex flex-col gap-3 px-4 pt-10 pb-8 sm:px-12 sm:pt-14 sm:pb-10">
          <Bar className="h-9 w-48 bg-surface-sunken" />
          <Bar className="h-5 w-72 max-w-full bg-surface-sunken" />
        </div>
        <div className="flex h-14 items-center gap-3 border-t border-outline px-4 sm:px-12">
          <Bar className="h-6 w-40 bg-surface-sunken" />
          <Bar className="h-8 w-16 bg-surface-sunken" />
        </div>
        <div className="grid flex-1 items-start border-t border-outline xl:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <div className="h-10 border-b border-outline" />
            {Array.from({ length: 5 }, (_, week) => (
              <div key={week} className="grid grid-cols-7 border-b border-outline last:border-b-0">
                {Array.from({ length: 7 }, (_, day) => (
                  <div
                    key={day}
                    className={`flex min-h-16 flex-col gap-2 border-l border-outline p-2 first:border-l-0 md:min-h-30 ${day >= 5 ? "bg-surface-muted" : ""}`}
                  >
                    <Bar className="size-5 rounded-full bg-surface-sunken" />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 self-stretch border-t border-outline px-4 pt-6 sm:px-6 xl:border-t-0 xl:border-l">
            <Bar className="h-4 w-32 bg-surface-sunken" />
            <Bar className="mb-3 h-7 w-44 bg-surface-sunken" />
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex gap-3 rounded-lg border border-outline p-3.5">
                <Bar className="h-3.5 w-10 bg-surface-sunken" />
                <div className="flex flex-1 flex-col gap-2">
                  <Bar className="h-3.5 w-full bg-surface-sunken" />
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
