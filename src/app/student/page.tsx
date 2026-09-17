import { Band, Container, PageHeader } from "@/components/brand/primitives"
import { requireRole } from "@/lib/auth/session"

export default async function StudentPracticePage() {
  const profile = await requireRole("student")

  return (
    <Band>
      <Container width="wide" className="flex flex-col gap-8">
        <PageHeader
          eyebrow="Practice"
          title={profile.fullName || "Your tasks"}
          description="Signed in as a student. Your task list arrives in a later phase."
        />
      </Container>
    </Band>
  )
}
