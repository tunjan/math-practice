import { notFound } from "next/navigation"

/**
 * The styleguide is a development tool. It stays out of deployed builds,
 * previews included, so design scratch pages are never public.
 */
export default function StyleguideLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (process.env.NODE_ENV !== "development") notFound()
  return children
}
