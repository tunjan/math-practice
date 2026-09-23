// Wipes every row and uploaded file in the Supabase project named in
// .env.local, then creates one tutor and one student. Irreversible.
//
//   node scripts/reset-and-seed.mjs
//
// Every table hangs off auth.users with ON DELETE CASCADE, so deleting the
// users clears profiles, tasks, hand-ins, comments, topics and invites. The
// first account created afterwards becomes the tutor (handle_new_user), so the
// tutor is always created before the student.
import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"
import readline from "node:readline"

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) process.env[m[1]] ??= m[2]
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local")
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
const projectRef = new URL(url).hostname.split(".")[0]

function ask(query, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    rl._writeToOutput = (text) => {
      if (!rl.muted) process.stdout.write(text)
    }
    rl.question(query, (answer) => {
      rl.close()
      if (hidden) process.stdout.write("\n")
      resolve(answer.trim())
    })
    rl.muted = hidden
  })
}

async function askPassword(who) {
  for (;;) {
    const first = await ask(`${who} password (10+ characters): `, { hidden: true })
    if (first.length < 10) {
      console.log("  Too short, try again.")
      continue
    }
    const again = await ask(`Confirm ${who.toLowerCase()} password: `, { hidden: true })
    if (first === again) return first
    console.log("  They didn't match, try again.")
  }
}

async function askAccount(who) {
  const fullName = await ask(`${who} full name: `)
  const email = await ask(`${who} email: `)
  const password = await askPassword(who)
  return { fullName, email, password }
}

/** Storage lists one folder level at a time; folders come back with no id. */
async function listAllPaths(bucket, prefix = "") {
  const paths = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000, offset })
    if (error) throw new Error(`${bucket}/${prefix}: ${error.message}`)
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.id === null) paths.push(...(await listAllPaths(bucket, path)))
      else paths.push(path)
    }
    if (data.length < 1000) return paths
  }
}

async function emptyStorage() {
  const { data: buckets, error } = await admin.storage.listBuckets()
  if (error) throw new Error(`listing buckets: ${error.message}`)
  for (const bucket of buckets) {
    const paths = await listAllPaths(bucket.id)
    for (let i = 0; i < paths.length; i += 100) {
      const { error: removeError } = await admin.storage.from(bucket.id).remove(paths.slice(i, i + 100))
      if (removeError) throw new Error(`${bucket.id}: ${removeError.message}`)
    }
    console.log(`  storage ${bucket.id}: removed ${paths.length} file(s)`)
  }
}

async function deleteAllUsers() {
  let total = 0
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (error) throw new Error(`listing users: ${error.message}`)
    if (data.users.length === 0) break
    for (const user of data.users) {
      const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
      if (deleteError) throw new Error(`deleting ${user.email}: ${deleteError.message}`)
      total += 1
    }
  }
  console.log(`  auth: deleted ${total} user(s) and everything that cascades from them`)
}

async function clearRateLimits() {
  const { error } = await admin.from("rate_limits").delete().gte("count", 0)
  if (error) throw new Error(`rate_limits: ${error.message}`)
  console.log("  rate_limits: cleared")
}

async function assertEmpty() {
  const tables = [
    "profiles",
    "assignments",
    "assignment_files",
    "submissions",
    "comments",
    "categories",
    "student_invites",
    "pending_assignments",
    "tutor_settings",
  ]
  for (const table of tables) {
    const { count, error } = await admin.from(table).select("*", { count: "exact", head: true })
    if (error) throw new Error(`${table}: ${error.message}`)
    if (count) throw new Error(`${table} still has ${count} row(s)`)
  }
  console.log("  verified: all app tables are empty")
}

async function createAccount({ email, password, fullName }, expectedRole) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (error) throw new Error(`creating ${email}: ${error.message}`)

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single()
  if (profileError) throw new Error(`reading profile for ${email}: ${profileError.message}`)
  if (profile.role !== expectedRole) {
    throw new Error(`${email} became a ${profile.role}, expected ${expectedRole}`)
  }
  console.log(`  created ${expectedRole}: ${fullName} <${email}>`)
}

console.log(`\nThis permanently deletes every user, task, hand-in, invite and uploaded file`)
console.log(`in the Supabase project "${projectRef}". It cannot be undone.\n`)

const typed = await ask(`Type the project ref (${projectRef}) to continue: `)
if (typed !== projectRef) {
  console.log("Cancelled. Nothing was changed.")
  process.exit(0)
}

console.log("\nThe first account is the tutor, the second the student.\n")
const tutor = await askAccount("Tutor")
console.log("")
const student = await askAccount("Student")

if (tutor.email.toLowerCase() === student.email.toLowerCase()) {
  console.error("The tutor and student need different emails. Nothing was changed.")
  process.exit(1)
}

try {
  console.log("\nWiping…")
  await emptyStorage()
  await deleteAllUsers()
  await clearRateLimits()
  await assertEmpty()

  console.log("\nSeeding…")
  await createAccount(tutor, "tutor")
  await createAccount(student, "student")

  console.log("\nDone. Sign in at /login with either account.")
} catch (error) {
  console.error(`\nFAILED: ${error.message}`)
  process.exit(1)
}
