import type { Metadata } from "next"

import { AuthCard, AuthLink } from "@/components/auth/auth-card"
import { ConfirmEmailForm } from "@/components/auth/confirm-email-form"
import { FormMessage } from "@/components/auth/form-message"

export const metadata: Metadata = {
  title: "Confirm your email · Maths Tasks",
  // The address carries a one-time token; keep it out of Referer headers.
  referrer: "no-referrer",
}
export const dynamic = "force-dynamic"

/**
 * Where the confirmation email lands. Opening the page does nothing on its
 * own: the token is only spent when the button is pressed.
 */
export default async function ConfirmEmailPage({ searchParams }: PageProps<"/auth/confirm">) {
  const params = await searchParams
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash : ""
  const type = typeof params.type === "string" ? params.type : ""

  if (!tokenHash || !type) {
    return (
      <AuthCard title="This link doesn't work" footer={<AuthLink href="/login">Go to sign in</AuthLink>}>
        <FormMessage error="This link isn't valid. Sign in and we'll send you a new one." />
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Confirm your email"
      description="One step left: confirm this is your address and we'll take you to your workspace."
      footer={<AuthLink href="/login">Back to sign in</AuthLink>}
    >
      <ConfirmEmailForm tokenHash={tokenHash} type={type} />
    </AuthCard>
  )
}
