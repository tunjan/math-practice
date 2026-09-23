import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const inter = localFont({
  src: "../fonts/Inter-Variable-latin.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
  style: "normal",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Helvetica", "sans-serif"],
})

const jetbrainsMono = localFont({
  src: "../fonts/JetBrainsMono-Variable-latin.woff2",
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: "100 800",
  style: "normal",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
})

const geistMono = localFont({
  src: "../fonts/GeistMono-Variable-latin.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
  style: "normal",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
})

// Display face for the Dub-styled student page; only ever set at 500.
const satoshi = localFont({
  src: "../fonts/Satoshi-Medium.woff2",
  variable: "--font-satoshi",
  display: "swap",
  weight: "500",
  style: "normal",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
})

export const metadata: Metadata = {
  title: "Maths Tasks",
  description:
    "Problem sets, hand-ins and feedback between a maths tutor and their students.",
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${geistMono.variable} ${satoshi.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-canvas-neutral font-sans text-on-surface">
        <TooltipProvider delay={200}>{children}</TooltipProvider>
      </body>
    </html>
  )
}
