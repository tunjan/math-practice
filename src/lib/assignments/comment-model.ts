export const MAX_COMMENT_LENGTH = 2000

/** One comment on a task, shaped for whoever is reading it. */
export type TaskComment = {
  id: string
  body: string
  at: string
  mine: boolean
  author: "tutor" | "student"
  /** "You" for the reader's own, otherwise the other person. */
  name: string
  /** Not yet confirmed by the server. */
  pending?: boolean
}
