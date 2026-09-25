import { Badge } from "@/components/ui/badge"
import { topicColor, type TopicTag } from "@/lib/syllabus/model"
import { cn } from "cn"

/**
 * A task's syllabus subtopics as Airtable pills: the code on the pill, the
 * title on hover and for screen readers. Renders nothing when there are none.
 */
export function TopicTags({
  tags,
  max,
  inline = false,
  className,
}: {
  tags: TopicTag[]
  /** Show at most this many, then "+n". */
  max?: number
  /** Spans instead of a list, for inside a button or other phrasing content. */
  inline?: boolean
  className?: string
}) {
  if (tags.length === 0) return null
  const shown = max ? tags.slice(0, max) : tags
  const hidden = tags.length - shown.length
  const Item = inline ? <span /> : <li />

  return (
    <List
      inline={inline}
      className={cn("flex flex-wrap gap-1", className)}
    >
      {shown.map((tag) => (
        <Badge
          key={tag.code}
          render={Item}
          variant={topicColor(tag.topic)}
          title={tag.title}
          className="font-mono tabular-nums"
        >
          <span className="sr-only">{tag.title}, </span>
          {tag.code}
        </Badge>
      ))}
      {hidden > 0 ? (
        <Badge
          render={Item}
          variant="gray"
          title={tags.slice(shown.length).map((t) => `${t.code} ${t.title}`).join("\n")}
        >
          +{hidden}
        </Badge>
      ) : null}
    </List>
  )
}

function List({ inline, className, children }: { inline: boolean; className: string; children: React.ReactNode }) {
  return inline ? (
    <span className={className}>{children}</span>
  ) : (
    <ul role="list" aria-label="Syllabus topics" className={className}>
      {children}
    </ul>
  )
}
