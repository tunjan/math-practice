import { ArrowUpRight } from "lucide-react"

import { ButtonLink } from "@/components/ui/button"
import { Band, Container, Eyebrow } from "@/components/brand/primitives"

export default function Home() {
  return (
    <main className="flex min-h-full flex-col justify-center">
      <Band className="py-16 md:py-24">
        <Container className="flex flex-col gap-6">
          <Eyebrow>Private tutoring workspace</Eyebrow>
          <h1 className="display-md text-ink md:display-lg lg:display-xl">
            Maths Tasks
          </h1>
          <p className="body-lg max-w-xl text-body">
            Assignments, submissions and feedback between a tutor and their
            students — in one quiet place.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <ButtonLink variant="primary" href="/login">
              Sign in
              <ArrowUpRight />
            </ButtonLink>
            <ButtonLink href="/styleguide">Design system</ButtonLink>
          </div>
        </Container>
      </Band>
    </main>
  )
}
