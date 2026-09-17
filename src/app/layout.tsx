import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted rather than fetched from Google at build time: the build must not
// depend on an outbound request, and users' browsers shouldn't make one either.
//
// Universal Sans is proprietary. DESIGN-x.ai.md names Inter 400 with negative
// display tracking as the closest open substitute; Geist Mono is the brand's
// documented mono companion.
const inter = localFont({
  src: "../fonts/Inter-Variable-latin.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
  style: "normal",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

const geistMono = localFont({
  src: "../fonts/GeistMono-Variable-latin.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
  style: "normal",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

export const metadata: Metadata = {
  title: "Maths Tasks",
  description: "Private tutoring and homework management for mathematics.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // `dark` is fixed on the root: the brand has no light counterpart, but
      // shadcn components ship `dark:` variants that must still resolve.
      className={`dark ${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-canvas text-ink min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
