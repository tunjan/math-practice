"use client"

import * as React from "react"
import { toast } from "sonner"

import { FormMessage } from "@/components/auth/form-message"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader, CardSection } from "@/components/ui/card"
import { Field } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/select"
import { saveStudentCourse, type CourseFormState } from "@/lib/syllabus/actions"
import {
  COURSE_LABEL,
  COURSES,
  LEVEL_LABEL,
  LEVELS,
  PROGRAMME_LABEL,
  PROGRAMMES,
  type StudentCourse,
} from "@/lib/syllabus/model"

/**
 * The student's programme, course and level. Setting one gives them a
 * syllabus tracker; removing it takes the tracker away and nothing else.
 */
export function CourseCard({ studentId, current }: { studentId: string; current: StudentCourse | null }) {
  const [state, action, pending] = React.useActionState<CourseFormState, FormData>(saveStudentCourse, {})
  const [programme, setProgramme] = React.useState<string>(current?.programme ?? "ib_dp")
  const [course, setCourse] = React.useState<string>(current?.course ?? "")
  const [level, setLevel] = React.useState<string>(current?.level ?? "")

  React.useEffect(() => {
    if (state.saved) toast.success(state.saved.cleared ? "Course removed" : "Course saved")
  }, [state.saved])

  const dirty =
    programme !== (current?.programme ?? "ib_dp") ||
    course !== (current?.course ?? "") ||
    level !== (current?.level ?? "")
  const complete = Boolean(programme && course && level)

  return (
    <Card>
      <form action={action}>
        <input type="hidden" name="student_id" value={studentId} />
        <CardHeader
          title="Course"
          description={
            current
              ? "Their syllabus tracker follows this course."
              : "Set a course to give this student a syllabus tracker. Optional."
          }
        />
        <CardSection className="flex flex-col gap-4">
          <FormMessage error={state.error} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Programme" htmlFor="programme">
              <NativeSelect
                id="programme"
                name="programme"
                value={programme}
                onChange={(e) => setProgramme(e.target.value)}
              >
                {PROGRAMMES.map((p) => (
                  <option key={p} value={p}>
                    {PROGRAMME_LABEL[p]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Course" htmlFor="course">
              <NativeSelect id="course" name="course" value={course} onChange={(e) => setCourse(e.target.value)}>
                <option value="" disabled>
                  Choose…
                </option>
                {COURSES.map((c) => (
                  <option key={c} value={c}>
                    {c} · {COURSE_LABEL[c]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Level" htmlFor="level">
              <NativeSelect id="level" name="level" value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="" disabled>
                  Choose…
                </option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l} · {LEVEL_LABEL[l]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
        </CardSection>
        <CardFooter className="justify-end">
          {current ? (
            <Button
              type="submit"
              name="intent"
              value="clear"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setProgramme("ib_dp")
                setCourse("")
                setLevel("")
              }}
            >
              Remove course
            </Button>
          ) : null}
          <Button type="submit" variant="primary" disabled={pending || !dirty || !complete}>
            {pending ? "Saving" : "Save"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
