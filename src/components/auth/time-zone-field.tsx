"use client"

/**
 * Posts the browser's time zone with the form, so a new account's deadlines
 * fall on the right day from the start. Filled in on mount rather than during
 * render, because the server cannot know the answer.
 */
export function TimeZoneField() {
  return (
    <input
      type="hidden"
      name="timezone"
      ref={(input) => {
        if (input) input.value = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ""
      }}
    />
  )
}
