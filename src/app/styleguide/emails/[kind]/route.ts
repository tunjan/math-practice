import { confirmEmail, feedbackEmail, newTaskEmail, welcomeEmail, type Email } from "@/lib/email/templates"

const url = "http://localhost:3000/student"

const SAMPLES: Record<string, () => Email> = {
  confirm: () => confirmEmail({ fullName: "Maya Okafor", url }),
  welcome: () => welcomeEmail({ fullName: "Maya Okafor", waitingTasks: 2, url }),
  "new-task": () =>
    newTaskEmail({
      fullName: "Maya Okafor",
      title: "Integration by parts — practice set 3",
      type: "problem_set",
      difficulty: "hard",
      dueAt: new Date(Date.now() + 4 * 86_400_000).toISOString(),
      timeZone: "Europe/London",
      url,
    }),
  approved: () =>
    feedbackEmail({
      fullName: "Maya Okafor",
      title: "Integration by parts — practice set 3",
      verdict: "approved",
      feedback: "Clear working throughout, and a tidy choice of u in question 6.",
      url,
    }),
  changes: () =>
    feedbackEmail({
      fullName: "Maya Okafor",
      title: "Integration by parts — practice set 3",
      verdict: "changes_requested",
      feedback:
        "Questions 1–4 are spot on.\n\nIn question 5 the sign flips when you integrate the second time, so the final answer is off by a factor of −1. Have another go at 5 and 7, and show the substitution step in full.",
      url,
    }),
}

/**
 * Renders each email exactly as it is sent, for checking the design in a
 * browser. A route handler sits outside the styleguide layout, so it repeats
 * that layout's development-only gate.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ kind: string }> }) {
  if (process.env.NODE_ENV !== "development") return new Response(null, { status: 404 })

  const sample = SAMPLES[(await params).kind]
  if (!sample) return new Response(`Try: ${Object.keys(SAMPLES).join(", ")}`, { status: 404 })

  return new Response(sample().html, { headers: { "Content-Type": "text/html; charset=utf-8" } })
}
