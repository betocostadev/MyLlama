import { createFileRoute } from '@tanstack/react-router'
import { ShieldCheck, HardDrive, Cpu, Layers } from 'lucide-react'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rounded-2xl p-6 sm:p-10 border border-[var(--line)]">
        <p className="island-kicker mb-2">MyLlama Architecture</p>
        <h1 className="display-title mb-4 text-3xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          Local-First, Private AI
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-[var(--sea-ink-soft)] mb-8">
          MyLlama keeps model inference and application data on your own machine. The backend acts as the sole boundary between clients, stored application data, and the Ollama model runtime.
        </p>

        {/* Architecture flow diagram */}
        <div className="mb-8 rounded-xl bg-black/5 dark:bg-white/5 p-5 border border-[var(--line)] font-mono text-xs overflow-x-auto">
          <pre className="text-[var(--sea-ink)] leading-5">
{` Browser / PWA (TanStack Start)
      │
      ▼ HTTP & Streaming SSE
 Bun + TypeScript API (Port 4000) ──────► Host Ollama (Port 11434)
      │                                    (Managed locally by user)
      ▼ SQL Queries
 PostgreSQL 16 (Port 5432 in Docker)`}
          </pre>
        </div>

        {/* Guiding Principles */}
        <h2 className="text-xl font-bold text-[var(--sea-ink)] mb-4">Core Principles</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--line)] p-4 bg-[var(--chip-bg)]">
            <div className="flex items-center gap-2 font-bold text-sm text-[var(--sea-ink)] mb-1">
              <HardDrive className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              1. Local-first Data
            </div>
            <p className="text-xs text-[var(--sea-ink-soft)] leading-relaxed">
              Inference runs locally using your Ollama models and application data is kept on your computer in PostgreSQL.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--line)] p-4 bg-[var(--chip-bg)]">
            <div className="flex items-center gap-2 font-bold text-sm text-[var(--sea-ink)] mb-1">
              <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              2. Clear Boundaries
            </div>
            <p className="text-xs text-[var(--sea-ink-soft)] leading-relaxed">
              Clients talk strictly to the Bun backend; the backend owns all database operations and Ollama communication.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--line)] p-4 bg-[var(--chip-bg)]">
            <div className="flex items-center gap-2 font-bold text-sm text-[var(--sea-ink)] mb-1">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              3. Privacy by Design
            </div>
            <p className="text-xs text-[var(--sea-ink-soft)] leading-relaxed">
              Tab-scoped guest sessions in sessionStorage and profile isolation ensure privacy across shared devices.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--line)] p-4 bg-[var(--chip-bg)]">
            <div className="flex items-center gap-2 font-bold text-sm text-[var(--sea-ink)] mb-1">
              <Cpu className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              4. Model Freedom
            </div>
            <p className="text-xs text-[var(--sea-ink-soft)] leading-relaxed">
              No locked-in or cloud-hosted dependencies. You bring your own choice of quantized models (e.g. Llama 3, Mistral, Qwen).
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
