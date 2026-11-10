import type { ReactNode } from 'react'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

export interface StatusCardProps {
  icon: ReactNode
  title: string
  isReady: boolean
  readyBadgeText?: string
  notReadyBadgeText?: string
  notReadyBadgeVariant?: 'rose' | 'amber' | 'zinc'
  description: ReactNode
  footer: string
}

export function StatusCard({
  icon,
  title,
  isReady,
  readyBadgeText = 'Connected',
  notReadyBadgeText = 'Disconnected',
  notReadyBadgeVariant = 'amber',
  description,
  footer,
}: StatusCardProps) {
  const renderBadge = () => {
    if (isReady) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-500/20 dark:border-emerald-500/40 px-2.5 py-0.5 rounded-full">
          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> {readyBadgeText}
        </span>
      )
    }

    if (notReadyBadgeVariant === 'rose') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/80 border border-rose-500/20 dark:border-rose-500/40 px-2.5 py-0.5 rounded-full">
          <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" /> {notReadyBadgeText}
        </span>
      )
    }

    if (notReadyBadgeVariant === 'zinc') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-400/20 dark:border-zinc-500/40 px-2.5 py-0.5 rounded-full">
          <AlertTriangle className="h-3 w-3 text-zinc-500 dark:text-zinc-400" /> {notReadyBadgeText}
        </span>
      )
    }

    // Default: amber
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/80 border border-amber-500/20 dark:border-amber-500/40 px-2.5 py-0.5 rounded-full">
        <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" /> {notReadyBadgeText}
      </span>
    )
  }

  return (
    <article className="island-shell rounded-2xl p-4 border border-[var(--line)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-bold text-xs text-[var(--sea-ink)]">{title}</span>
          </div>
          {renderBadge()}
        </div>
        <div className="text-xs text-[var(--sea-ink-soft)] mb-2">
          {description}
        </div>
      </div>
      <div className="pt-2 border-t border-[var(--line)] text-[10px] text-[var(--sea-ink-soft)] font-mono">
        {footer}
      </div>
    </article>
  )
}
