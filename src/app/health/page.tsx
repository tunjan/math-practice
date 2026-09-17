import { CheckCircle2, XCircle } from "lucide-react"

import { Band, Container, Eyebrow } from "@/components/brand/primitives"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/brand/table"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type Check = { name: string; ok: boolean; detail: string }

/**
 * A connectivity page for development. It proves three things at once: the env
 * vars are present, the server client can reach the project, and RLS is denying
 * a signed-out caller — an anonymous read returning zero rows is the *correct*
 * result here, not a failure.
 */
export default async function HealthPage() {
  const checks: Check[] = []

  let supabase
  try {
    supabase = await createClient()
    checks.push({
      name: "Environment",
      ok: true,
      detail: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    })
  } catch (error) {
    checks.push({
      name: "Environment",
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    })
  }

  if (supabase) {
    const { data: userData } = await supabase.auth.getUser()
    checks.push({
      name: "Session",
      ok: true,
      detail: userData.user ? `signed in as ${userData.user.email}` : "signed out",
    })

    const { error: reachError } = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
    checks.push({
      name: "Database reachable",
      ok: !reachError,
      detail: reachError ? reachError.message : "categories queried",
    })

    // Signed out, every policy must deny. Zero rows is the pass condition.
    const { data: leaked, error: leakError } = await supabase
      .from("assignments")
      .select("id")
      .limit(1)
    checks.push({
      name: "RLS denies anonymous reads",
      ok: !!leakError || (leaked?.length ?? 0) === 0,
      detail: leakError
        ? `rejected: ${leakError.message}`
        : `${leaked?.length ?? 0} assignment rows visible`,
    })

    // The rate limiter lives in a schema PostgREST does not publish, so this
    // must fail. A success here would mean a browser could burn the budget.
    // The wrapper is typed (it lives in `public`), but EXECUTE is granted to
    // service_role alone, so a publishable key must be refused here.
    const { error: rpcError } = await supabase.rpc("consume_rate_limit", {
      p_key: "health",
      p_limit: 1,
      p_window_secs: 60,
    })
    checks.push({
      name: "Rate limiter not exposed over HTTP",
      ok: !!rpcError,
      detail: rpcError ? "not reachable from a client" : "REACHABLE — investigate",
    })
  }

  const allOk = checks.every((c) => c.ok)

  return (
    <main className="flex min-h-full flex-col">
      <Band className="py-16">
        <Container className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <Eyebrow>Diagnostics</Eyebrow>
            <h1 className="display-sm text-ink">
              {allOk ? "All checks passing" : "Something needs attention"}
            </h1>
            <p className="body-md text-body-mid">
              Development-only. Confirms the app can reach Supabase and that the
              database is refusing what it should refuse.
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Check</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checks.map((check) => (
                <TableRow key={check.name}>
                  <TableCell>
                    {check.ok ? (
                      <CheckCircle2 className="size-4 text-breeze" />
                    ) : (
                      <XCircle className="size-4 text-destructive" />
                    )}
                  </TableCell>
                  <TableCell className="text-ink">{check.name}</TableCell>
                  <TableCell className="text-body-mid">{check.detail}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Container>
      </Band>
    </main>
  )
}
