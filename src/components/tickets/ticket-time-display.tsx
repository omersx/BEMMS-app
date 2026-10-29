"use client"

import { useEffect, useState } from "react"

interface TicketTimeDisplayProps {
  reportedAt?: Date | string | null
  className?: string
}

function formatLocalRelative(dateStr: Date | string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ""

  const now = Date.now()
  const diffMs = Math.max(0, now - date.getTime())
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })

  if (diffMinutes < 1) {
    return `Reported just now (${timeStr})`
  }
  if (diffMinutes < 60) {
    return `Reported ${diffMinutes}m ago (${timeStr})`
  }
  if (diffHours < 24) {
    return `Reported ${diffHours}h ago (${timeStr})`
  }
  if (diffDays === 1) {
    return `Reported yesterday at ${timeStr}`
  }

  const dateFormatted = date.toLocaleDateString([], { month: "short", day: "numeric" })
  return `Reported ${dateFormatted} at ${timeStr}`
}

export function TicketTimeDisplay({ reportedAt, className }: TicketTimeDisplayProps) {
  const [formatted, setFormatted] = useState<string>("")

  useEffect(() => {
    if (!reportedAt) return
    setFormatted(formatLocalRelative(reportedAt))
    // Update every minute for live relative time
    const interval = setInterval(() => {
      setFormatted(formatLocalRelative(reportedAt))
    }, 60000)
    return () => clearInterval(interval)
  }, [reportedAt])

  if (!reportedAt) return null
  if (!formatted) {
    // Fallback during initial hydration to prevent mismatch
    const d = new Date(reportedAt)
    return <span className={className}>Reported recently</span>
  }

  return <span className={className}>{formatted}</span>
}
