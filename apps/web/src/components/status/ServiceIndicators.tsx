import type { ReactNode } from 'react'
import { Server, Database, Cpu, RefreshCw } from 'lucide-react'

export interface ServiceIndicatorChipProps {
  icon: ReactNode
  label: string
  value: string
  isReady: boolean
  variant?: 'emerald' | 'blue' | 'purple'
  notReadyVariant?: 'rose' | 'amber' | 'zinc'
}

export function ServiceIndicatorChip({
  icon,
  label,
  value,
  isReady,
  variant = 'emerald',
  notReadyVariant = 'amber',
}: ServiceIndicatorChipProps) {
  const getStyleClass = () => {
    if (isReady) {
      switch (variant) {
        case 'blue':
          return 'border-blue-500/30 bg-blue-50 text-blue-900 dark:border-sky-4500/20 dark:bg-sky-950/80 dark:text-sky-200'
        case 'purple':
          return 'border-purple-500/30 bg-purple-50 text-purple-900 dark:border-purple-500/20 dark:bg-purple-950/80 dark:text-purple-200'
        case 'emerald':
        default:
          return 'border-emerald-500/30 bg-emerald-50 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-950/80 dark:text-emerald-200'
      }
    }

    switch (notReadyVariant) {
      case 'rose':
        return 'border-rose-500/30 bg-rose-50 text-rose-900 dark:border-rose-400/50 dark:bg-rose-950/80 dark:text-rose-200'
      case 'zinc':
        return 'border-zinc-400/40 bg-zinc-100 text-zinc-900 dark:border-zinc-500/50 dark:bg-zinc-800/80 dark:text-zinc-200'
      case 'amber':
      default:
        return 'border-amber-500/30 bg-amber-50 text-amber-900 dark:border-amber-400/50 dark:bg-amber-950/80 dark:text-amber-200'
    }
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors shadow-xs ${getStyleClass()}`}
    >
      <span className="shrink-0">{icon}</span>
      <span>
        <span className="opacity-90">{label}:</span>{' '}
        <span className="font-semibold">{value}</span>
      </span>
    </div>
  )
}

export interface ServiceIndicatorsProps {
  isBackendReady: boolean
  isPostgresReady: boolean
  isOllamaReady: boolean
  modelsCount: number
  isRefreshing: boolean
  onRefresh: () => void
}

export function ServiceIndicators({
  isBackendReady,
  isPostgresReady,
  isOllamaReady,
  modelsCount,
  isRefreshing,
  onRefresh,
}: ServiceIndicatorsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {/* Bun API */}
      <ServiceIndicatorChip
        icon={<Server className="h-3.5 w-3.5" />}
        label="Bun API"
        value={isBackendReady ? 'Online (4000)' : 'Offline'}
        isReady={isBackendReady}
        variant="emerald"
        notReadyVariant="rose"
      />

      {/* PostgreSQL */}
      <ServiceIndicatorChip
        icon={<Database className="h-3.5 w-3.5" />}
        label="PostgreSQL"
        value={isPostgresReady ? 'Docker (5432)' : 'Disconnected'}
        isReady={isPostgresReady}
        variant="blue"
        notReadyVariant="amber"
      />

      {/* Ollama */}
      <ServiceIndicatorChip
        icon={<Cpu className="h-3.5 w-3.5" />}
        label="Ollama"
        value={
          isOllamaReady
            ? `Host (${modelsCount} model${modelsCount === 1 ? '' : 's'})`
            : 'Offline'
        }
        isReady={isOllamaReady}
        variant="purple"
        notReadyVariant="zinc"
      />

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        title="Refresh service status"
        className="rounded-full border border-[var(--line)] bg-[var(--chip-bg)] p-1.5 text-[var(--sea-ink)] hover:bg-[var(--link-bg-hover)] transition shadow-xs disabled:opacity-60"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}
