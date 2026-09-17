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
 * it deliberately is not — task text is written by the tutor but rendered in
 * the student's browser, and there is no reason for it to carry markup.
 *
 * Styling is explicit rather than via a prose plugin so the type ladder and
 * weight-400 rule from DESIGN-x.ai.md survive contact with generated markup.
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
        "flex flex-col gap-4 body-md text-body",
        "[&_h1]:display-sm [&_h1]:text-ink [&_h1]:mt-2",
        "[&_h2]:display-xs [&_h2]:text-ink [&_h2]:mt-2",
        "[&_h3]:body-lg [&_h3]:text-ink",
        "[&_p]:body-md",
        "[&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4",
        "[&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5",
        "[&_ol]:flex [&_ol]:list-decimal [&_ol]:flex-col [&_ol]:gap-2 [&_ol]:pl-5",
        "[&_li]:pl-1 [&_li::marker]:text-body-mid",
        "[&_blockquote]:border-l [&_blockquote]:border-hairline [&_blockquote]:pl-4 [&_blockquote]:text-body-mid",
        "[&_code]:rounded [&_code]:bg-canvas-soft [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm",
        "[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-hairline [&_pre]:bg-canvas-soft [&_pre]:p-4",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_hr]:border-hairline",
        "[&_table]:w-full [&_table]:border-collapse",
        "[&_th]:eyebrow-sm [&_th]:border-b [&_th]:border-hairline [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-body-mid",
        "[&_td]:border-b [&_td]:border-hairline [&_td]:px-3 [&_td]:py-2",
        // KaTeX ships its own sizing; keep display maths from overflowing on
        // a phone.
        "[&_.katex-display]:overflow-x-auto [&_.katex-display]:py-2",
        className
      )}
    >
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {children}
      </Markdown>
    </div>
  )
}
