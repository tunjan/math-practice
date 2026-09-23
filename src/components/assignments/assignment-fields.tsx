"use client"

import * as React from "react"
import { BookOpen, Plus, Sigma, X } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { AssignmentType } from "@/lib/assignments/model"

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
    <section className="grid gap-5 border-t border-outline p-6 first:border-t-0 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="title-md text-on-surface">{title}</h2>
        {description ? (
          <p className="body-sm text-on-surface-muted">{description}</p>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-col gap-5">{children}</div>
    </section>
  )
}

/** Visual radio: the selection mark takes the product accent. */
function RadioMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
        checked ? "border-accent-orange bg-accent-orange" : "border-outline-strong bg-surface"
      )}
    >
      {checked ? <span className="size-1.5 rounded-full bg-surface" /> : null}
    </span>
  )
}

const TYPES = [
  { value: "problem_set", label: "Problem set", hint: "Questions to work through", icon: Sigma },
  { value: "reading_notes", label: "Reading notes", hint: "Read and take notes", icon: BookOpen },
] as const

export function TypeChoice({ defaultValue = "problem_set" }: { defaultValue?: AssignmentType }) {
  const [value, setValue] = React.useState<string>(defaultValue)

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 label-md text-on-surface-secondary">Type</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {TYPES.map((option) => {
          const Icon = option.icon
          const checked = value === option.value
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 transition-colors",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-on-surface",
                checked
                  ? "border-on-surface bg-surface-sunken"
                  : "border-outline-strong bg-surface hover:bg-surface-sunken"
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
              <Icon className="size-5 shrink-0 text-on-surface-secondary" aria-hidden />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="label-md text-on-surface">{option.label}</span>
                <span className="body-sm text-on-surface-muted">{option.hint}</span>
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
        <span className="body-sm text-on-surface-muted">Markdown and LaTeX</span>
        <div
          role="group"
          aria-label="Editor mode"
          className="flex h-8 items-center rounded-full bg-surface-sunken p-1"
        >
          {(["write", "preview"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              onClick={() => setMode(option)}
              className={cn(
                "h-6 rounded-full px-3 label-sm capitalize transition-colors",
                mode === option ? "bg-surface text-on-surface" : "text-on-surface-muted hover:text-on-surface"
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
        <div className="min-h-40 rounded-md border border-outline bg-surface-sunken px-4 py-3">
          {text.trim() ? (
            <MathProse>{text}</MathProse>
          ) : (
            <p className="body-sm text-on-surface-muted">Nothing to preview yet.</p>
          )}
        </div>
      ) : null}

      <p className="body-sm text-on-surface-muted">
        Use <Code>$x^2$</Code> for inline maths and <Code>$$…$$</Code> for a display block.
      </p>
    </div>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-xs border border-outline bg-surface-sunken px-1 py-0.5 font-mono text-[12px] text-on-surface-secondary">
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
      <legend className="mb-2 label-md text-on-surface-secondary">Topic</legend>

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
                  "inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border px-3 label-sm transition-colors",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-on-surface",
                  checked
                    ? "border-on-surface bg-surface-sunken text-on-surface"
                    : "border-outline-strong bg-surface text-on-surface-secondary hover:bg-surface-sunken"
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
