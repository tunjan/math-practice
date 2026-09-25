"use client"

import * as React from "react"

import { TAG_COLORS } from "@/components/ui/badge"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { TOPIC_NAME, topicColor, type SyllabusTopic } from "@/lib/syllabus/model"
import { cn } from "cn"

type Group = { value: string; items: SyllabusTopic[] }

function groupByStrand(topics: SyllabusTopic[]): Group[] {
  const groups = new Map<number, SyllabusTopic[]>()
  for (const t of topics) groups.set(t.topic, [...(groups.get(t.topic) ?? []), t])
  return [...groups].map(([topic, items]) => ({ value: `${topic} · ${TOPIC_NAME[topic]}`, items }))
}

/** "1.2" matches by code prefix; anything else searches the title. */
function matches(topic: SyllabusTopic, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return topic.code.startsWith(q) || topic.title.toLowerCase().includes(q)
}

/**
 * Tags a task with syllabus subtopics: Airtable-style pills in a field, with
 * a searchable list grouped by strand. Posts each chosen id as `name`.
 */
export function TopicPicker({
  topics,
  value,
  onValueChange,
  name = "syllabus_topic",
  id,
  "aria-label": ariaLabel,
  className,
}: {
  /** The student's subtopics, already filtered to their course and level. */
  topics: SyllabusTopic[]
  value: string[]
  onValueChange: (ids: string[]) => void
  name?: string
  id?: string
  "aria-label"?: string
  className?: string
}) {
  const anchor = useComboboxAnchor()
  const groups = React.useMemo(() => groupByStrand(topics), [topics])
  const selected = React.useMemo(() => topics.filter((t) => value.includes(t.id)), [topics, value])

  return (
    <>
      {value.map((topicId) => (
        <input key={topicId} type="hidden" name={name} value={topicId} />
      ))}
      <Combobox
        multiple
        items={groups}
        value={selected}
        onValueChange={(next: SyllabusTopic[]) => onValueChange(next.map((t) => t.id))}
        isItemEqualToValue={(a: SyllabusTopic, b: SyllabusTopic) => a.id === b.id}
        itemToStringLabel={(t: SyllabusTopic) => `${t.code} ${t.title}`}
        filter={matches}
      >
        <ComboboxChips ref={anchor} className={className}>
          <ComboboxValue>
            {(chosen: SyllabusTopic[]) =>
              chosen.map((t) => (
                <ComboboxChip
                  key={t.id}
                  title={t.title}
                  aria-label={`${t.code} ${t.title}`}
                  className={cn("font-mono tabular-nums", TAG_COLORS[topicColor(t.topic)])}
                >
                  {t.code}
                </ComboboxChip>
              ))
            }
          </ComboboxValue>
          <ComboboxChipsInput
            id={id}
            aria-label={ariaLabel}
            placeholder={selected.length ? "" : "Syllabus topics: search by code or name"}
          />
        </ComboboxChips>
        <ComboboxContent anchor={anchor} className="dub">
          <ComboboxEmpty>No subtopic matches.</ComboboxEmpty>
          <ComboboxList>
            {(group: Group) => (
              <ComboboxGroup key={group.value} items={group.items}>
                <ComboboxLabel>{group.value}</ComboboxLabel>
                <ComboboxCollection>
                  {(t: SyllabusTopic) => (
                    <ComboboxItem key={t.id} value={t}>
                      <span
                        className={cn(
                          "inline-flex h-5 min-w-9 shrink-0 items-center justify-center rounded-full px-1.5 font-mono text-xs text-on-tag tabular-nums",
                          TAG_COLORS[topicColor(t.topic)]
                        )}
                      >
                        {t.code}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{t.title}</span>
                      {t.level === "AHL" ? (
                        <span className="shrink-0 text-xs text-on-surface-muted">HL</span>
                      ) : null}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </>
  )
}
