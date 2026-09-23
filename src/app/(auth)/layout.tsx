import { Wordmark } from "@/components/brand/primitives"

/**
 * Onboarding context: `canvas-cool` behind a single white card. Nothing else
 * competes with the form.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas-cool">
      <header className="flex h-16 items-center px-4 md:px-8">
        <Wordmark href="/" />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:items-center sm:pt-0">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  )
}
