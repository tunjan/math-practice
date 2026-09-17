"use client"

import * as React from "react"
import { ArrowUpRight, Bell, Feather, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Band,
  Container,
  EmptyState,
  Eyebrow,
  PageHeader,
  Rule,
  StatusDot,
} from "@/components/brand/primitives"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/brand/table"

const SWATCHES = [
  { name: "canvas", value: "#0a0a0a", cls: "bg-canvas" },
  { name: "canvas-soft", value: "#1a1c20", cls: "bg-canvas-soft" },
  { name: "canvas-card", value: "#191919", cls: "bg-canvas-card" },
  { name: "canvas-mid", value: "#363a3f", cls: "bg-canvas-mid" },
  { name: "hairline", value: "#212327", cls: "bg-hairline" },
  { name: "ink", value: "#ffffff", cls: "bg-ink" },
  { name: "body", value: "#dadbdf", cls: "bg-body" },
  { name: "body-mid", value: "#7d8187", cls: "bg-body-mid" },
  { name: "sunset", value: "#ff7a17", cls: "bg-sunset" },
  { name: "sunset-soft", value: "#ffc285", cls: "bg-sunset-soft" },
  { name: "dusk", value: "#7c3aed", cls: "bg-dusk" },
  { name: "twilight", value: "#c4b5fd", cls: "bg-twilight" },
  { name: "breeze", value: "#a0c3ec", cls: "bg-breeze" },
  { name: "midnight", value: "#0d1726", cls: "bg-midnight" },
]

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <Band ruled>
      <Container className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="display-sm text-ink">{title}</h2>
        </div>
        {children}
      </Container>
    </Band>
  )
}

export default function StyleguidePage() {
  return (
    <main className="flex min-h-full flex-col">
      {/* hero-band */}
      <Band className="py-16 md:py-24">
        <Container className="flex flex-col gap-6">
          <Eyebrow>Design system · DESIGN-x.ai.md</Eyebrow>
          <h1 className="display-md text-ink md:display-lg lg:display-xl">
            Maths Tasks
          </h1>
          <p className="body-lg max-w-xl text-body">
            Every primitive in the application, rendered against the brand
            canvas. Compare this page to the design file before shipping UI.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="primary">
              Sign up now
              <ArrowUpRight />
            </Button>
            <Button>Read announcement</Button>
          </div>
        </Container>
      </Band>

      <Section eyebrow="01 — Type" title="Ladder">
        <div className="flex flex-col gap-6">
          {[
            ["display-xl · 96 / -2.4", "display-xl"],
            ["display-lg · 72 / -1.8", "display-lg"],
            ["display-md · 48 / -1.2", "display-md"],
            ["display-sm · 32 / -0.6", "display-sm"],
            ["display-xs · 20", "display-xs"],
            ["body-lg · 18", "body-lg"],
            ["body-md · 16", "body-md"],
            ["body-sm · 14", "body-sm"],
          ].map(([label, cls]) => (
            <div key={cls} className="flex flex-col gap-1">
              <Eyebrow size="sm">{label}</Eyebrow>
              <p className={`${cls} text-ink`}>Solve for the unknown</p>
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <Eyebrow size="sm">caption-mono · 14 / +1.4</Eyebrow>
            <p className="eyebrow text-ink">Problem set · due in 2 days</p>
          </div>
        </div>
      </Section>

      <Section eyebrow="02 — Colour" title="Palette">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {SWATCHES.map((s) => (
            <div key={s.name} className="flex flex-col gap-2">
              <div
                className={`h-16 w-full rounded-lg border border-hairline ${s.cls}`}
              />
              <div className="flex flex-col">
                <span className="eyebrow-sm text-ink">{s.name}</span>
                <span className="eyebrow-sm text-body-mid">{s.value}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="body-sm text-body-mid">
          Accents are reserved for illustrations, the companion, and status
          dots. They never fill a button or a badge.
        </p>
      </Section>

      <Section eyebrow="03 — Buttons" title="The pill is the shape system">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button>Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">
              <Trash2 />
              Delete
            </Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Notifications">
              <Bell />
            </Button>
            <Button size="icon-sm" aria-label="Add">
              <Plus />
            </Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </Section>

      <Section eyebrow="04 — Surfaces" title="Cards carry hairlines, not shadows">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Integration by parts</CardTitle>
              <CardDescription>
                Problem set · 6 questions · due Friday 18:00
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="body-sm text-body">
                Work through the parts formula, then attempt the reduction
                exercises at the end.
              </p>
              <div className="flex gap-2">
                <Badge variant="strong">
                  <StatusDot accent="sunset" />
                  Awaiting review
                </Badge>
                <Badge>Calculus</Badge>
              </div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Compact card</CardTitle>
              <CardDescription>data-size=&quot;sm&quot;</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="body-sm text-body-mid">
                Tighter interior padding for dense lists and sidebars.
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section eyebrow="05 — Badges" title="Labels are mono-caps, never fills">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="strong">Strong</Badge>
          <Badge variant="solid">3 new</Badge>
          <Badge variant="muted">Muted</Badge>
          <Badge variant="destructive">Overdue</Badge>
          <Badge variant="strong">
            <StatusDot accent="breeze" />
            Submitted
          </Badge>
          <Badge variant="strong">
            <StatusDot accent="twilight" />
            Approved
          </Badge>
          <Badge variant="strong">
            <StatusDot accent="dusk" />
            Opened
          </Badge>
        </div>
      </Section>

      <Section eyebrow="06 — Forms" title="Inputs stay 8px rectangles">
        <div className="grid max-w-xl gap-5">
          <div className="grid gap-2">
            <Label htmlFor="sg-email" className="eyebrow-sm text-body-mid">
              Email
            </Label>
            <Input id="sg-email" type="email" placeholder="you@example.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sg-note" className="eyebrow-sm text-body-mid">
              Note to your tutor
            </Label>
            <Textarea
              id="sg-note"
              placeholder="I'd like more practice on integration by parts…"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sg-bad" className="eyebrow-sm text-body-mid">
              Invalid state
            </Label>
            <Input id="sg-bad" aria-invalid defaultValue="not-an-email" />
          </div>
          <div className="flex gap-3">
            <Button variant="primary">
              <Feather />
              Ask for a challenge
            </Button>
            <Button variant="ghost">Cancel</Button>
          </div>
        </div>
      </Section>

      <Section eyebrow="07 — Data" title="Tables">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              ["Amara Osei", "Integration by parts", "Fri 18:00", "sunset", "Awaiting review"],
              ["Jonas Weber", "Vectors: dot product", "Mon 09:00", "breeze", "Submitted"],
              ["Lena Fischer", "Proof by induction", "Wed 17:00", "mute", "Assigned"],
            ].map(([student, task, due, accent, status]) => (
              <TableRow key={student}>
                <TableCell className="text-ink">{student}</TableCell>
                <TableCell>{task}</TableCell>
                <TableCell className="numeric text-body-mid">{due}</TableCell>
                <TableCell>
                  <span className="eyebrow-sm inline-flex items-center gap-2 text-body">
                    <StatusDot accent={accent as "sunset"} />
                    {status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Section eyebrow="08 — States" title="Empty">
        <EmptyState
          icon={<Feather className="size-6" />}
          title="No tasks yet"
          description="When your tutor assigns work it will appear here, newest deadline first."
          action={<Button>Ask for a challenge</Button>}
        />
      </Section>

      <Band ruled className="py-10">
        <Container className="flex flex-col gap-4">
          <Rule />
          <p className="body-sm text-body-mid">
            Maths Tasks — private tutoring workspace.
          </p>
        </Container>
      </Band>
    </main>
  )
}
