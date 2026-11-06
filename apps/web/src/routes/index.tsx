import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import {
  Server,
  Database,
  Cpu,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Terminal,
} from 'lucide-react'

export const Route = createFileRoute('/')({ component: Dashboard })

interface HealthResponse {
  status: 'ready' | 'degraded' | 'unknown'
  timestamp: string
  services: {
    database: {
      status: 'connected' | 'disconnected'
      message: string
    }
    ollama: {
      status: 'connected' | 'disconnected'
      version?: string
      modelsCount?: number
      message: string
    }
  }
}

interface OllamaModel {
  name: string;
  size: number;
}

export function Dashboard() {
  const [apiUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return (window as unknown as { __VITE_API_URL?: string }).__VITE_API_URL || 'http://localhost:4000'
    }
    return 'http://localhost:4000'
  })

  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [healthData, setHealthData] = useState<HealthResponse | null>(null)
  const [models, setModels] = useState<OllamaModel[]>([])
  const [latency, setLatency] = useState<number | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const checkHealth = useCallback(async () => {
    setIsRefreshing(true)
    const startTime = performance.now()

    try {
      // 1. Check basic backend health
      const baseRes = await fetch(`${apiUrl}/health`, {
        signal: AbortSignal.timeout(3000),
      })

      if (!baseRes.ok) {
        throw new Error(`Server returned HTTP ${baseRes.status}`)
      }

      setBackendStatus('online')
      setLatency(Math.round(performance.now() - startTime))

      // 2. Check full readiness (PostgreSQL + Ollama)
      const readyRes = await fetch(`${apiUrl}/health/ready`, {
        signal: AbortSignal.timeout(4000),
      })
      const readyJson = (await readyRes.json()) as HealthResponse
      setHealthData(readyJson)

      // 3. Fetch models if Ollama is connected
      if (readyJson.services?.ollama?.status === 'connected') {
        const modelsRes = await fetch(`${apiUrl}/api/models`, {
          signal: AbortSignal.timeout(3000),
        })
        if (modelsRes.ok) {
          const modelsJson = await modelsRes.json()
          setModels(modelsJson.models || [])
        }
      } else {
        setModels([])
      }
    } catch {
      setBackendStatus('offline')
      setLatency(null)
      setHealthData(null)
      setModels([])
    } finally {
      setIsRefreshing(false)
      setLastChecked(new Date())
    }
  }, [apiUrl])

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 8000)
    return () => clearInterval(interval)
  }, [checkHealth])

  const isPostgresReady = healthData?.services?.database?.status === 'connected'
  const isOllamaReady = healthData?.services?.ollama?.status === 'connected'
  const isBackendReady = backendStatus === 'online'

  return (
    <main className="page-wrap px-4 pb-16 pt-10">
      {/* Hero section */}
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3.5 py-1 text-xs font-semibold text-[var(--sea-ink)]">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isBackendReady && isPostgresReady ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isBackendReady && isPostgresReady ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span>Milestone 1: Scaffold &amp; Service Health</span>
          </div>

          <button
            onClick={checkHealth}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full border border-[var(--line)] bg-[var(--island-bg)] px-4 py-1.5 text-xs font-medium text-[var(--sea-ink)] hover:bg-[var(--chip-bg)] transition shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Checking...' : 'Refresh Status'}
          </button>
        </div>

        <h1 className="display-title mb-3 max-w-3xl text-3xl font-extrabold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          Local-First AI Workspace
        </h1>
        <p className="mb-6 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          MyLlama runs your language models privately on your computer via Ollama, connected to a Bun TypeScript server and PostgreSQL in Docker.
        </p>

        {lastChecked && (
          <p className="text-xs text-[var(--sea-ink-soft)] opacity-80">
            Last probed: {lastChecked.toLocaleTimeString()} &bull; Target API: <code>{apiUrl}</code>
            {latency !== null && ` (${latency}ms roundtrip)`}
          </p>
        )}
      </section>

      {/* Service Health Cards */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-[var(--sea-ink)]">Service Connectivity</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* 1. Bun API Server */}
          <article className="island-shell rise-in rounded-2xl p-5 border border-[var(--line)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--sea-ink)]">Bun API</h3>
                    <p className="text-xs text-[var(--sea-ink-soft)]">apps/server</p>
                  </div>
                </div>
                {backendStatus === 'online' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Online
                  </span>
                ) : backendStatus === 'checking' ? (
                  <span className="text-xs text-amber-500">Checking...</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                    <XCircle className="h-3.5 w-3.5" /> Offline
                  </span>
                )}
              </div>

              <p className="text-xs text-[var(--sea-ink-soft)] mb-3">
                {backendStatus === 'online'
                  ? `HTTP server responding normally at port 4000.`
                  : `Cannot connect to ${apiUrl}. Start the Bun server with 'bun run dev:server'.`}
              </p>
            </div>

            <div className="pt-3 border-t border-[var(--line)] text-[11px] text-[var(--sea-ink-soft)] font-mono">
              Port: 4000 &bull; Framework: Hono
            </div>
          </article>

          {/* 2. PostgreSQL Database */}
          <article className="island-shell rise-in rounded-2xl p-5 border border-[var(--line)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--sea-ink)]">PostgreSQL</h3>
                    <p className="text-xs text-[var(--sea-ink-soft)]">Docker Service</p>
                  </div>
                </div>
                {isPostgresReady ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="h-3.5 w-3.5" /> Disconnected
                  </span>
                )}
              </div>

              <p className="text-xs text-[var(--sea-ink-soft)] mb-3">
                {isPostgresReady
                  ? 'Database connection active via SQL query probe.'
                  : healthData?.services?.database?.message ||
                    'Run "bun run docker:up" to start the PostgreSQL container.'}
              </p>
            </div>

            <div className="pt-3 border-t border-[var(--line)] text-[11px] text-[var(--sea-ink-soft)] font-mono">
              Port: 5432 &bull; DB: myllama
            </div>
          </article>

          {/* 3. Ollama AI Engine */}
          <article className="island-shell rise-in rounded-2xl p-5 border border-[var(--line)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--sea-ink)]">Ollama</h3>
                    <p className="text-xs text-[var(--sea-ink-soft)]">Host Service</p>
                  </div>
                </div>
                {isOllamaReady ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 bg-zinc-500/10 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="h-3.5 w-3.5" /> Optional
                  </span>
                )}
              </div>

              <p className="text-xs text-[var(--sea-ink-soft)] mb-3">
                {isOllamaReady
                  ? `Connected (v${healthData?.services?.ollama?.version || 'detected'}). Found ${healthData?.services?.ollama?.modelsCount ?? 0} model(s).`
                  : 'Ollama is optional for scaffolding. Start Ollama locally with `ollama serve`.'}
              </p>
            </div>

            <div className="pt-3 border-t border-[var(--line)] text-[11px] text-[var(--sea-ink-soft)] font-mono">
              Port: 11434 &bull; Host-managed
            </div>
          </article>
        </div>
      </section>

      {/* Installed Models list if available */}
      {models.length > 0 && (
        <section className="mt-8 island-shell rounded-2xl p-6 border border-[var(--line)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[var(--sea-ink)]">
              Installed Ollama Models ({models.length})
            </h2>
            <span className="text-xs text-[var(--sea-ink-soft)]">Ready for chat features</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {models.map((m) => (
              <span
                key={m.name}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-xs font-medium text-[var(--sea-ink)]"
              >
                <span>🦙</span>
                <span className="font-semibold">{m.name}</span>
                <span className="text-[10px] text-[var(--sea-ink-soft)]">
                  ({(m.size / (1024 * 1024 * 1024)).toFixed(1)} GB)
                </span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Quick Start Commands */}
      <section className="mt-8 island-shell rounded-2xl p-6 border border-[var(--line)]">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="h-4 w-4 text-[var(--sea-ink)]" />
          <h2 className="text-base font-bold text-[var(--sea-ink)]">Quick Start Commands</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-xs font-mono">
          <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3.5 border border-[var(--line)]">
            <p className="font-sans text-[var(--sea-ink-soft)] font-medium mb-1">
              Start Full Dev Environment:
            </p>
            <code className="text-emerald-600 dark:text-emerald-400 font-bold">bun run dev</code>
            <p className="mt-2 text-[11px] font-sans text-[var(--sea-ink-soft)]">
              Runs web UI (port 3000) and Bun API (port 4000) concurrently.
            </p>
          </div>

          <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3.5 border border-[var(--line)]">
            <p className="font-sans text-[var(--sea-ink-soft)] font-medium mb-1">
              Start PostgreSQL via Docker:
            </p>
            <code className="text-blue-600 dark:text-blue-400 font-bold">bun run docker:up</code>
            <p className="mt-2 text-[11px] font-sans text-[var(--sea-ink-soft)]">
              Spins up PostgreSQL 16 container with persistent volume.
            </p>
          </div>

          <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3.5 border border-[var(--line)]">
            <p className="font-sans text-[var(--sea-ink-soft)] font-medium mb-1">
              Launch Host Ollama:
            </p>
            <code className="text-purple-600 dark:text-purple-400 font-bold">ollama serve</code>
            <p className="mt-2 text-[11px] font-sans text-[var(--sea-ink-soft)]">
              Pulls and serves models locally on port 11434.
            </p>
          </div>

          <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3.5 border border-[var(--line)]">
            <p className="font-sans text-[var(--sea-ink-soft)] font-medium mb-1">
              Containerized Server Smoke Test:
            </p>
            <code className="text-amber-600 dark:text-amber-400 font-bold">
              docker compose up --build
            </code>
            <p className="mt-2 text-[11px] font-sans text-[var(--sea-ink-soft)]">
              Builds and tests the Bun server inside Docker.
            </p>
          </div>
        </div>
      </section>

      {/* Documentation links */}
      <section className="mt-8 flex flex-wrap gap-4 text-xs">
        <a
          href="/about"
          className="inline-flex items-center gap-1.5 text-[var(--sea-ink)] hover:underline font-medium"
        >
          View System Architecture <ExternalLink className="h-3 w-3" />
        </a>
      </section>
    </main>
  )
}
