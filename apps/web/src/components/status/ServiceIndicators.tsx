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
          return 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300'
        case 'purple':
          return 'border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300'
        case 'emerald':
        default:
          return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      }
    }

    switch (notReadyVariant) {
      case 'rose':
        return 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'
      case 'zinc':
        return 'border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
      case 'amber':
      default:
        return 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
    }
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium ${getStyleClass()}`}
    >
      {icon}
      <span>
        {label}: {value}
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
        value={isOllamaReady ? `Host (${modelsCount} model${modelsCount === 1 ? '' : 's'})` : 'Offline'}
        isReady={isOllamaReady}
        variant="purple"
        notReadyVariant="zinc"
      />

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        title="Refresh service status"
        className="rounded-full border border-[var(--line)] bg-[var(--island-bg)] p-1.5 text-[var(--sea-ink)] hover:bg-[var(--chip-bg)] transition shadow-sm disabled:opacity-60"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}
