import { Band, Container, PageHeader } from "@/components/brand/primitives"
import { requireRole } from "@/lib/auth/session"

export default async function TutorOverviewPage() {
  const profile = await requireRole("tutor")

  return (
    <Band>
      <Container width="wide" className="flex flex-col gap-8">
        <PageHeader
          eyebrow="Teaching overview"
          title={profile.fullName || "Your workspace"}
          description="Signed in as a tutor. The dashboard arrives in a later phase."
        />
      </Container>
    </Band>
  )
}
