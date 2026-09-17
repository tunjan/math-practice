import { cn } from "cn"
import { STAGES, STAGE_LABEL, stageIndex, type Stage } from "@/lib/assignments/model"

/**
 * Assigned → Opened → Submitted → Reviewed.
 *
 * Every step carries its timestamp, because "has the student opened this?" is
 * usually really "when did they open it?" — and a bare tick loses that.
 */
export function LifecycleTracker({
  stage,
  timestamps,
}: {
  stage: Stage
  timestamps: Partial<Record<Stage, string | null>>
}) {
  const current = stageIndex(stage)

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
      {STAGES.map((step, index) => {
        const reached = index <= current
        const stamp = timestamps[step]

        return (
          <li
            key={step}
            className="flex flex-1 gap-3 sm:flex-col sm:gap-2"
          >
            {/* Rail: vertical on mobile, horizontal on desktop */}
            <div className="flex flex-col items-center sm:w-full sm:flex-row">
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full border",
                  reached
                    ? "border-ink bg-ink"
                    : "border-hairline bg-canvas"
                )}
              />
              {index < STAGES.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "w-px flex-1 sm:h-px sm:w-full sm:flex-1",
                    index < current ? "bg-ink" : "bg-hairline"
                  )}
                />
              ) : null}
            </div>

            <div className="flex flex-col gap-0.5 pb-6 sm:pb-0 sm:pr-4">
              <span
                className={cn(
                  "body-sm",
                  reached ? "text-ink" : "text-body-mid"
                )}
              >
                {STAGE_LABEL[step]}
              </span>
              <span className="text-xs text-body-mid">
                {stamp
                  ? new Date(stamp).toLocaleString(undefined, {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : reached
                    ? "—"
                    : "Not yet"}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
