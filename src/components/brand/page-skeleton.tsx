import { Page } from "@/components/brand/primitives"
import { Card } from "@/components/ui/card"

function Bar({ className }: { className: string }) {
  return <span className={`block rounded-xs bg-outline motion-safe:animate-pulse ${className}`} />
}

/** Loading shape for a workspace page: the header bar, then a card of rows. */
export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Page
      aria-busy="true"
      aria-label="Loading"
      header={
        <div className="shrink-0 border-b border-outline">
          <div className="mx-auto flex h-12 w-full max-w-content items-center justify-between px-3 sm:h-16 lg:px-6">
            <Bar className="h-6 w-32 bg-surface-sunken" />
            <Bar className="h-10 w-28 rounded-md bg-surface-sunken" />
          </div>
        </div>
      }
    >
      <Card>
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="flex h-14 items-center justify-between gap-6 border-t border-outline px-4 first:border-t-0"
          >
            <div className="flex flex-col gap-2">
              <Bar className="h-3.5 w-64 max-w-[50vw] bg-surface-sunken" />
              <Bar className="h-3 w-32 bg-surface-sunken" />
            </div>
            <Bar className="h-5 w-20 rounded-full bg-surface-sunken" />
          </div>
        ))}
      </Card>
    </Page>
  )
}

/** Loading shape for the calendar, in its ruled Dub column. */
export function CalendarSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="dub flex flex-1 flex-col bg-surface xl:h-svh xl:min-h-0">
      <div className="shrink-0 border-b border-outline">
        <div className="flex h-12 w-full items-center justify-between px-3 sm:h-16 lg:px-6">
          <Bar className="h-6 w-24 bg-surface-sunken" />
          <Bar className="h-8 w-32 rounded-md bg-surface-sunken" />
        </div>
      </div>
      <div className="flex w-full flex-1 flex-col gap-4 px-3 pt-4 lg:px-6 xl:min-h-0 xl:pb-6">
        <div className="flex items-center gap-2">
          <Bar className="h-8 w-16 rounded-md bg-surface-sunken" />
          <Bar className="h-8 w-20 rounded-md bg-surface-sunken" />
          <Bar className="h-5 w-36 bg-surface-sunken" />
        </div>
        <div className="grid items-start gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-stretch 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col overflow-hidden rounded-xl ring-1 ring-foreground/10 xl:h-full">
            <div className="h-8 border-b border-outline" />
            {Array.from({ length: 5 }, (_, week) => (
              <div key={week} className="grid grid-cols-7 border-b border-outline last:border-b-0 xl:flex-1">
                {Array.from({ length: 7 }, (_, day) => (
                  <div key={day} className="min-h-14 border-l border-outline p-1.5 first:border-l-0 md:min-h-28 lg:min-h-32 xl:min-h-0">
                    <Bar className="size-6 rounded-md bg-surface-sunken" />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 overflow-hidden rounded-xl py-4 ring-1 ring-foreground/10 xl:self-start">
            <div className="flex items-center px-4">
              <Bar className="h-5 w-40 bg-surface-sunken" />
            </div>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex gap-2.5 px-4 py-2">
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
