import Link from "next/link"

import { Container } from "@/components/brand/primitives"

/**
 * The auth shell: a single centred card on the canvas, nothing else competing
 * for attention.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="px-6 py-5">
        <Container>
          <Link
            href="/"
            className="display-xs text-ink transition-opacity hover:opacity-70"
          >
            Maths Tasks
          </Link>
        </Container>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="px-6 py-6">
        <Container>
          <p className="eyebrow-sm text-body-mid">
            Private tutoring workspace
          </p>
        </Container>
      </footer>
    </div>
  )
}
