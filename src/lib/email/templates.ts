import { DIFFICULTY_LABEL, type Difficulty } from "@/lib/assignments/difficulty"
import { formatDue } from "@/lib/assignments/dates"
import { TYPE_LABEL, type AssignmentType, type ReviewVerdict } from "@/lib/assignments/model"

/**
 * The emails the app sends, as plain HTML strings: three to a student, and
 * the confirmation a tutor gets when they sign up.
 *
 * Email clients ignore stylesheets, custom properties and most layout CSS, so
 * the DESIGN.md tokens are repeated here as literals and the layout is tables
 * with inline styles. Everything else follows the app: one black action per
 * message, hairline borders instead of shadows, sentence case, 14px body.
 */

export type Email = { subject: string; html: string; text: string }

const APP_NAME = "Maths Tasks"

const FONT =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

const COLOR = {
  canvas: "#F5F5F5",
  surface: "#FFFFFF",
  surfaceMuted: "#FAFAFA",
  border: "#E5E5E5",
  emphasis: "#171717",
  body: "#404040",
  subtle: "#737373",
  muted: "#A3A3A3",
  primary: "#000000",
  onTag: "#1D1F25",
} as const

/** DESIGN.md › tag palette: a pale fill with the one shared ink. */
const TAG = {
  blue: "#CFDFFF",
  green: "#D1F7C4",
  yellow: "#FFEAB6",
  purple: "#EDE2FE",
} as const

/** Long feedback is cut here; the rest is one click away in the app. */
const MAX_QUOTE_LENGTH = 600

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? ""
}

function greeting(fullName: string): string {
  const name = firstName(fullName)
  return name ? `Hi ${name},` : "Hi,"
}

function tag(label: string, fill: string): string {
  return `<span style="display:inline-block;height:20px;line-height:20px;padding:0 8px;border-radius:9999px;background:${fill};color:${COLOR.onTag};font-size:12px;font-weight:400;">${escapeHtml(label)}</span>`
}

/** Label–value rows divided by hairlines, like a card list in the app. */
function details(rows: [label: string, value: string][]): string {
  const body = rows
    .map(
      ([label, value], index) =>
        `<tr>
          <td style="padding:10px 16px;font-size:14px;line-height:20px;color:${COLOR.subtle};${index > 0 ? `border-top:1px solid ${COLOR.border};` : ""}">${escapeHtml(label)}</td>
          <td align="right" style="padding:10px 16px;font-size:14px;line-height:20px;font-weight:500;color:${COLOR.emphasis};${index > 0 ? `border-top:1px solid ${COLOR.border};` : ""}">${escapeHtml(value)}</td>
        </tr>`
    )
    .join("")
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;border:1px solid ${COLOR.border};border-radius:12px;border-collapse:separate;">${body}</table>`
}

function quote(text: string): string {
  return `<div style="margin:24px 0 0;padding:12px 16px;background:${COLOR.surfaceMuted};border:1px solid ${COLOR.border};border-radius:12px;font-size:14px;line-height:22px;color:${COLOR.body};white-space:pre-wrap;">${escapeHtml(text)}</div>`
}

function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
    <tr>
      <td style="border-radius:8px;background:${COLOR.primary};">
        <a href="${escapeHtml(href)}" style="display:inline-block;height:40px;line-height:40px;padding:0 16px;border-radius:8px;font-size:14px;font-weight:500;color:#FFFFFF;text-decoration:none;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`
}

function layout(options: {
  preview: string
  tag: string
  title: string
  body: string
  footer: string
}): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${escapeHtml(options.title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.canvas};font-family:${FONT};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(options.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.canvas};">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr>
          <td style="padding:0 4px 16px;font-size:14px;line-height:20px;font-weight:600;color:${COLOR.emphasis};">${APP_NAME}</td>
        </tr>
        <tr>
          <td style="padding:32px;background:${COLOR.surface};border:1px solid ${COLOR.border};border-radius:12px;">
            ${options.tag}
            <h1 style="margin:16px 0 0;font-size:20px;line-height:28px;font-weight:600;color:${COLOR.emphasis};">${escapeHtml(options.title)}</h1>
            ${options.body}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 4px 0;font-size:12px;line-height:16px;color:${COLOR.muted};">${escapeHtml(options.footer)}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

function paragraph(text: string): string {
  return `<p style="margin:8px 0 0;font-size:14px;line-height:22px;color:${COLOR.body};">${escapeHtml(text)}</p>`
}

// ── Welcome ─────────────────────────────────────────────────────────────────

export function welcomeEmail(input: {
  fullName: string
  /** Tasks the tutor queued against the invite, already waiting. */
  waitingTasks: number
  url: string
}): Email {
  const waiting =
    input.waitingTasks === 0
      ? "New tasks from your tutor will show up there, and we'll email you when one arrives."
      : input.waitingTasks === 1
        ? "Your tutor has already set you a task. It's waiting in your workspace."
        : `Your tutor has already set you ${input.waitingTasks} tasks. They're waiting in your workspace.`
  const intro = "Your account is ready. This is where you'll find your tasks, hand in work and read feedback."

  return {
    subject: `Welcome to ${APP_NAME}`,
    html: layout({
      preview: intro,
      tag: tag("Welcome", TAG.purple),
      title: `Welcome to ${APP_NAME}`,
      body:
        paragraph(greeting(input.fullName)) +
        paragraph(intro) +
        paragraph(waiting) +
        button("Open your workspace", input.url),
      footer: `You're receiving this because you created a ${APP_NAME} account.`,
    }),
    text: [greeting(input.fullName), "", intro, waiting, "", `Open your workspace: ${input.url}`].join("\n"),
  }
}

// ── Confirm a tutor's email ─────────────────────────────────────────────────

export function confirmEmail(input: { fullName: string; url: string }): Email {
  const intro = `Confirm this address to finish setting up your ${APP_NAME} tutor account.`
  const expiry = "The link works once and expires in an hour. If it has, sign in and we'll send another."

  return {
    subject: `Confirm your email for ${APP_NAME}`,
    html: layout({
      preview: intro,
      tag: tag("Confirm email", TAG.blue),
      title: "Confirm your email",
      body: paragraph(greeting(input.fullName)) + paragraph(intro) + button("Confirm email", input.url) + paragraph(expiry),
      footer: `If you didn't sign up for ${APP_NAME}, you can ignore this email.`,
    }),
    text: [greeting(input.fullName), "", intro, "", `Confirm email: ${input.url}`, "", expiry].join("\n"),
  }
}

// ── New task ────────────────────────────────────────────────────────────────

export function newTaskEmail(input: {
  fullName: string
  title: string
  type: AssignmentType
  difficulty: Difficulty
  dueAt: string
  timeZone: string
  url: string
}): Email {
  const due = formatDue(input.dueAt, input.timeZone)
  const intro = "Your tutor has set you a new task."

  return {
    subject: `New task: ${input.title}`,
    html: layout({
      preview: `Due ${due}`,
      tag: tag("New task", TAG.blue),
      title: input.title,
      body:
        paragraph(`${greeting(input.fullName)} ${intro.charAt(0).toLowerCase()}${intro.slice(1)}`) +
        details([
          ["Due", due],
          ["Type", TYPE_LABEL[input.type]],
          ["Difficulty", DIFFICULTY_LABEL[input.difficulty]],
        ]) +
        button("Open task", input.url),
      footer: `You're receiving this because your tutor set you work on ${APP_NAME}.`,
    }),
    text: [
      greeting(input.fullName),
      "",
      `${intro} ${input.title}`,
      `Due: ${due}`,
      `Type: ${TYPE_LABEL[input.type]}`,
      `Difficulty: ${DIFFICULTY_LABEL[input.difficulty]}`,
      "",
      `Open task: ${input.url}`,
    ].join("\n"),
  }
}

// ── Feedback ────────────────────────────────────────────────────────────────

export function feedbackEmail(input: {
  fullName: string
  title: string
  verdict: ReviewVerdict
  feedback: string | null
  url: string
}): Email {
  const approved = input.verdict === "approved"
  const intro = approved
    ? "Your tutor has reviewed your work and approved it. Nicely done."
    : "Your tutor has reviewed your work and asked for a few changes before it's finished."

  const feedback = input.feedback?.trim() ?? ""
  const truncated = feedback.length > MAX_QUOTE_LENGTH
  const shown = truncated ? `${feedback.slice(0, MAX_QUOTE_LENGTH).trimEnd()}…` : feedback

  return {
    subject: approved ? `Approved: ${input.title}` : `Feedback on ${input.title}`,
    html: layout({
      preview: shown || intro,
      tag: approved ? tag("Approved", TAG.green) : tag("Changes requested", TAG.yellow),
      title: input.title,
      body:
        paragraph(`${greeting(input.fullName)} ${intro.charAt(0).toLowerCase()}${intro.slice(1)}`) +
        (shown ? quote(shown) : "") +
        button(truncated ? "Read the full feedback" : approved ? "View task" : "Open task", input.url),
      footer: `You're receiving this because your tutor reviewed your work on ${APP_NAME}.`,
    }),
    text: [greeting(input.fullName), "", intro, ...(shown ? ["", shown] : []), "", `Open task: ${input.url}`].join("\n"),
  }
}
