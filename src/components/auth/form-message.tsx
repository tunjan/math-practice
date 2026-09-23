import { CircleAlert, CircleCheck } from "lucide-react"
import { cn } from "cn"

/**
 * Inline form feedback. A pale semantic container with its paired ink, so the
 * colour is a background signal and the sentence stays readable.
 */
export function FormMessage({
  id,
  error,
  notice,
  className,
}: {
  id?: string
  error?: string
  notice?: string
  className?: string
}) {
  if (!error && !notice) return null
  const isError = Boolean(error)

  return (
    <div
      id={id}
      role={isError ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "flex items-start gap-2.5 rounded-md px-3 py-2.5 body-sm",
        isError
          ? "bg-error-container text-on-error-container"
          : "bg-success-container text-on-success-container",
        className
      )}
    >
      {isError ? (
        <CircleAlert className="mt-px size-4 shrink-0" aria-hidden />
      ) : (
        <CircleCheck className="mt-px size-4 shrink-0" aria-hidden />
      )}
      <span className="min-w-0 flex-1">{error ?? notice}</span>
    </div>
  )
}
