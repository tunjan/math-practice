import "server-only"

import type { Email } from "./templates"

/**
 * Sends one transactional email through Resend's HTTP API.
 *
 * Never throws: an email is a courtesy on top of an action that has already
 * succeeded, so a failure here is logged and swallowed rather than turned into
 * an error the tutor or student would see. Without the two RESEND_* variables
 * it does nothing, which keeps local development and previews quiet.
 */
export async function sendEmail(to: string, email: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !from) {
    console.info(`[email] Skipped "${email.subject}": RESEND_API_KEY or RESEND_FROM_EMAIL is not set.`)
    return
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    })

    if (!response.ok) {
      console.error(`[email] Resend refused "${email.subject}": ${response.status} ${await response.text()}`)
      return
    }
    const { id } = (await response.json()) as { id?: string }
    console.info(`[email] Resend accepted "${email.subject}" (${id})`)
  } catch (error) {
    console.error(`[email] Could not send "${email.subject}":`, error)
  }
}
