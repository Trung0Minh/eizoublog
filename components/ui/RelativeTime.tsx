import { formatDate, formatExactDateTime } from "@/lib/utils"

interface RelativeTimeProps {
  className?: string
  date: Date | string
}

export function RelativeTime({ className, date }: RelativeTimeProps) {
  const value = new Date(date)

  return (
    <time
      className={className}
      dateTime={value.toISOString()}
      title={formatExactDateTime(value)}
      suppressHydrationWarning
    >
      {formatDate(value)}
    </time>
  )
}
