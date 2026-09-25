"use client"

import * as React from "react"
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { trackerToCsv } from "@/lib/syllabus/csv"
import type { TrackerRow } from "@/lib/syllabus/model"

/** Downloads the tracker as a CSV, built in the browser from what's on screen. */
export function ExportCsvButton({ rows, filename }: { rows: TrackerRow[]; filename: string }) {
  const download = React.useCallback(() => {
    // The BOM tells Excel the file is UTF-8, so accents in notes survive.
    const blob = new Blob(["﻿", trackerToCsv(rows)], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }, [rows, filename])

  return (
    <Button variant="secondary" size="sm" onClick={download}>
      <Download aria-hidden /> Export CSV
    </Button>
  )
}
