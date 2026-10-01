"use client"

import * as React from "react"
import { BookOpen, Plus, Sigma, X } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Textarea } from "@/components/ui/textarea"
import type { AssignmentType } from "@/lib/assignments/model"
import {
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  DIFFICULTY_LABEL,
  type Difficulty,
} from "@/lib/assignments/difficulty"

import { MathProse } from "./math-prose"

export type Topic = { id: string; name: string }

/**
 * One section of a long form: what it is on the left, the fields on the
 * right. Sections are separated by hairlines inside a single card.
 */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="grid gap-5 border-t border-border p-4 first:border-t-0 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="title-md text-foreground">{title}</h2>
        {description ? (
          <p className="body-md text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-5">{children}</div>
    </section>
  )
}

/** Visual radio: blue-500 when chosen, like every selection control. */
function RadioMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
        checked ? "border-tertiary-strong bg-tertiary-strong" : "border-input bg-background"
      )}
    >
      {checked ? <span className="size-1.5 rounded-full bg-background" /> : null}
    </span>
  )
}

const TYPES = [
  { value: "problem_set", label: "Problem set", hint: "Questions to work through", icon: Sigma },
  { value: "reading_notes", label: "Reading notes", hint: "Read and take notes", icon: BookOpen },
] as const

const DIFFICULTY_OPTIONS = DIFFICULTIES.map((value) => ({ value, label: DIFFICULTY_LABEL[value] }))

/** Easy to ultra. */
export function DifficultyChoice({ defaultValue = DEFAULT_DIFFICULTY }: { defaultValue?: Difficulty }) {
  const [value, setValue] = React.useState<Difficulty>(defaultValue)

  return (
    <SegmentedControl
      legend="Difficulty"
      name="difficulty"
      value={value}
      onValueChange={setValue}
      options={DIFFICULTY_OPTIONS}
    />
  )
}

export function TypeChoice({ defaultValue = "problem_set" }: { defaultValue?: AssignmentType }) {
  const [value, setValue] = React.useState<string>(defaultValue)

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 label-md text-foreground/80">Type</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {TYPES.map((option) => {
          const Icon = option.icon
          const checked = value === option.value
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-foreground",
                checked
                  ? "border-foreground bg-muted"
                  : "border-input bg-background hover:bg-muted"
              )}
            >
              <input
                type="radio"
                name="type"
                value={option.value}
                checked={checked}
                onChange={() => setValue(option.value)}
                className="sr-only"
              />
              <Icon className="size-5 shrink-0 text-foreground/80" aria-hidden />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="label-md text-foreground">{option.label}</span>
                <span className="body-md text-muted-foreground">{option.hint}</span>
              </span>
              <RadioMark checked={checked} />
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Markdown + LaTeX editor with a Write / Preview segmented control. */
export function InstructionsField({ defaultValue = "" }: { defaultValue?: string }) {
  const [text, setText] = React.useState(defaultValue)
  const [mode, setMode] = React.useState<"write" | "preview">("write")
  const id = React.useId()

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        {/* The section heading already says "Instructions". */}
        <Label htmlFor={id} className="sr-only">
          Instructions
        </Label>
        <span className="body-md text-muted-foreground">Markdown and LaTeX</span>
        <div
          role="group"
          aria-label="Editor mode"
          className="flex h-8 items-center rounded-lg bg-muted p-1"
        >
          {(["write", "preview"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              onClick={() => setMode(option)}
              className={cn(
                "h-6 rounded-md px-3 label-sm capitalize transition-colors",
                mode === option ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* The textarea stays mounted so the value is always submitted. */}
      <Textarea
        id={id}
        name="description"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={8}
        placeholder={"Work through questions 1 to 8.\n\nRemember $\\int u\\,dv = uv - \\int v\\,du$."}
        className={cn(mode === "preview" && "hidden")}
      />
      {mode === "preview" ? (
        <div className="min-h-40 rounded-lg border border-border bg-muted px-4 py-3">
          {text.trim() ? (
            <MathProse>{text}</MathProse>
          ) : (
            <p className="body-md text-muted-foreground">Nothing to preview yet.</p>
          )}
        </div>
      ) : null}

      <p className="body-md text-muted-foreground">
        Use <Code>$x^2$</Code> for inline maths and <Code>$$…$$</Code> for a display block.
      </p>
    </div>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-sm border border-border bg-muted px-1 py-0.5 font-mono text-[12px] text-foreground/80">
      {children}
    </code>
  )
}

/**
 * Topic: pick one, none, or type a new one. The chips are selection controls,
 * so they carry a radio mark rather than a status colour.
 */
export function TopicField({
  topics,
  defaultValue = "",
}: {
  topics: Topic[]
  defaultValue?: string
}) {
  const [value, setValue] = React.useState(defaultValue)
  const [adding, setAdding] = React.useState(false)

  const options = [{ id: "", name: "No topic" }, ...topics]

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 label-md text-foreground/80">Topic</legend>

      {adding ? (
        <div className="flex gap-2">
          <Input
            name="new_category"
            placeholder="e.g. Sequences and series"
            aria-label="New topic name"
            autoFocus
            maxLength={80}
            className="flex-1"
          />
          <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
            <X aria-hidden />
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((topic) => {
            const checked = value === topic.id
            return (
              <label
                key={topic.id || "none"}
                className={cn(
                  "inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border px-3 label-sm transition-colors",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-foreground",
                  checked
                    ? "border-foreground bg-muted text-foreground"
                    : "border-input bg-background text-foreground/80 hover:bg-muted"
                )}
              >
                <input
                  type="radio"
                  name="category_id"
                  value={topic.id}
                  checked={checked}
                  onChange={() => setValue(topic.id)}
                  className="sr-only"
                />
                <RadioMark checked={checked} />
                {topic.name}
              </label>
            )
          })}
          <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <Plus aria-hidden />
            New topic
          </Button>
        </div>
      )}
    </fieldset>
  )
}
