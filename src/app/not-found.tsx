import { FileQuestion } from "lucide-react"

import { EmptyState, Wordmark } from "@/components/brand/primitives"
import { ButtonLink } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas-cool">
      <header className="flex h-16 items-center px-4 md:px-8">
        <Wordmark href="/" />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <Card className="w-full max-w-md">
          <EmptyState
            icon={<FileQuestion />}
            title="Page not found"
            description="It may have been deleted, or the link is wrong."
            action={
              <ButtonLink href="/" variant="primary">
                Go to your workspace
              </ButtonLink>
            }
          />
        </Card>
      </main>
    </div>
  )
}
