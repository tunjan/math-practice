import Markdown from "react-markdown"
import rehypeKatex from "rehype-katex"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"

import "katex/dist/katex.min.css"

import { cn } from "cn"

/**
 * Renders a task description: Markdown for structure, KaTeX for maths.
 *
 * react-markdown does not evaluate raw HTML unless rehype-raw is added, which
 * it deliberately is not: task text is written by the tutor but rendered in
 * the student's browser, and there is no reason for it to carry markup.
 *
 * Styling is explicit rather than via a prose plugin so the Quiet Console type
 * scale survives contact with generated markup.
 */
export function MathProse({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex max-w-[72ch] flex-col gap-3 body-lg text-foreground",
        "[&_h1]:headline-md [&_h1]:mt-3 [&_h2]:headline-md [&_h2]:mt-3 [&_h3]:title-md [&_h3]:mt-2",
        "[&_strong]:font-semibold",
        "[&_a]:underline [&_a]:decoration-input [&_a]:underline-offset-4 hover:[&_a]:decoration-foreground",
        "[&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5",
        "[&_ol]:flex [&_ol]:list-decimal [&_ol]:flex-col [&_ol]:gap-1.5 [&_ol]:pl-5",
        "[&_li]:pl-1 [&_li::marker]:text-muted-foreground",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-input [&_blockquote]:pl-4 [&_blockquote]:text-foreground/80",
        "[&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.875em]",
        "[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_hr]:my-2 [&_hr]:border-border",
        "[&_table]:w-full [&_table]:border-collapse [&_table]:body-md",
        "[&_th]:border-b [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:label-sm [&_th]:text-muted-foreground",
        "[&_td]:border-b [&_td]:border-border [&_td]:px-3 [&_td]:py-2",
        // KaTeX sets its own sizes; keep display maths from overflowing on a phone.
        "[&_.katex-display]:overflow-x-auto [&_.katex-display]:py-1",
        className
      )}
    >
      <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {children}
      </Markdown>
    </div>
  )
}
