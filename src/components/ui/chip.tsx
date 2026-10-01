/**
 * The composer dialogs' property chips and borderless text fields (New task,
 * New event). A chip shows its current value, or its name when empty, so the
 * structure explains itself without helper text.
 */
export const chipClass = [
  "inline-flex h-8 w-auto max-w-full items-center gap-1.5 rounded-lg border border-input bg-background px-2.5 label-sm text-foreground outline-none",
  "focus-visible:ring-2 focus-visible:ring-foreground/50",
  "transition-[background-color,border-color,color] duration-150",
  "hover:bg-muted data-popup-open:bg-muted",
  "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
  "aria-invalid:border-destructive aria-invalid:text-destructive aria-invalid:[&_svg]:text-destructive",
].join(" ")

/** A chip that is switched on: DESIGN.md's blue "selected" state. */
export const chipOnClass =
  "data-pressed:border-tertiary/30 data-pressed:bg-tertiary-container/50 data-pressed:text-tertiary data-pressed:[&_svg]:text-tertiary"

/** Borderless: the dialog is the field. The caret marks focus. */
export const composerField =
  "w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
