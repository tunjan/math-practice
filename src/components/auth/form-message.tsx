import { AlertCircle, Info } from "lucide-react"

/**
 * Validation feedback in the brand's voice: no coloured fill, no icon-heavy
 * alert box. Errors are the one place the destructive colour appears, and only
 * as text plus a hairline.
 */
export function FormMessage({
  error,
  notice,
}: {
  error?: string
  notice?: string
}) {
  if (!error && !notice) return null

  const isError = Boolean(error)

  return (
    <p
      role={isError ? "alert" : "status"}
      aria-live="polite"
      className={[
        "flex items-start gap-2 rounded-lg border px-3 py-2 body-sm",
        isError
          ? "border-destructive/40 text-destructive"
          : "border-hairline text-body",
      ].join(" ")}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
      ) : (
        <Info className="mt-0.5 size-4 shrink-0" />
      )}
      <span>{error ?? notice}</span>
    </p>
  )
}
