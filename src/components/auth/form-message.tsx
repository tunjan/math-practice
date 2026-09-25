import { CircleAlert, CircleCheck } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
    <Alert
      id={id}
      variant={isError ? "error" : "success"}
      role={isError ? "alert" : "status"}
      aria-live="polite"
      className={className}
    >
      {isError ? <CircleAlert aria-hidden /> : <CircleCheck aria-hidden />}
      <AlertDescription>{error ?? notice}</AlertDescription>
    </Alert>
  )
}
