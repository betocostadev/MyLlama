import { createFileRoute } from '@tanstack/react-router'
import { useRef, useEffect } from 'react'
import { useServiceHealth, useModelConfig, useOllamaChat, useApiUrl } from '@myllama/hooks'
import { ServiceIndicators } from '../components/status/ServiceIndicators'
import { StatusCard } from '../components/status/StatusCard'
import {
  Server,
  Database,
  Cpu,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Trash2,
  Bot,
  User,
  Loader2,
  ExternalLink,
} from 'lucide-react'

export const Route = createFileRoute('/')({ component: Dashboard })

export function Dashboard() {
  const apiUrl = useApiUrl()

  // 1. Service Health & Connectivity hook
  const {
    isBackendReady,
    isPostgresReady,
    isOllamaReady,
    healthData,
    latency,
    isRefreshing,
    checkHealth,
  } = useServiceHealth({})

  // 2. Model Selection & Configuration hook
  const { models, selectedModel, setSelectedModel, config, isLoadingModels } =
    useModelConfig({})

  // 3. Ollama Chat & Streaming hook
  const {
    messages,
    inputPrompt,
    setInputPrompt,
    isGenerating,
    chatError,
    sendMessage,
    toggleThinking,
    clearChat,
  } = useOllamaChat({ model: selectedModel, config })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isGenerating])

  const samplePrompts = [
    'Explain how local AI differs from cloud AI in 2 sentences.',
    'Write a small TypeScript function that calculates Fibonacci numbers.',
    'Why is PostgreSQL good for relational application data?',
  ]

  return (
    <main className="page-wrap px-4 pb-16 pt-8">
      {/* Top Bar with Live Service Chips */}
      <section className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🦙</span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--sea-ink)]">
              MyLlama Workspace
            </h1>
          </div>
        </div>

        {/* Live Service Indicators */}
        <ServiceIndicators
          isBackendReady={isBackendReady}
          isPostgresReady={isPostgresReady}
          isOllamaReady={isOllamaReady}
          modelsCount={models.length}
          isRefreshing={isRefreshing}
          onRefresh={() => checkHealth()}
        />
      </section>

      {/* Main Interactive Chat Card */}
      <section className="island-shell rise-in rounded-2xl border border-[var(--line)] shadow-sm overflow-hidden flex flex-col h-[640px]">
        {/* Chat Header: Model Selector + Clear Chat */}
        <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--header-bg)] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-semibold text-[var(--sea-ink)]">Active Model:</span>
            {models.length > 0 ? (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="rounded-lg border border-[var(--line)] bg-[var(--island-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--sea-ink)] focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              >
                {models.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({(m.size / (1024 * 1024 * 1024)).toFixed(1)} GB)
                  </option>
                ))}
              </select>
            ) : isLoadingModels ? (
              <span className="text-xs text-[var(--sea-ink-soft)]">Loading models...</span>
            ) : (
              <span className="text-xs font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                {isOllamaReady ? 'No models found' : 'Ollama not connected'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--island-bg)] px-2.5 py-1 text-xs font-medium text-[var(--sea-ink-soft)] hover:text-rose-500 hover:border-rose-500/30 transition"
              title="Clear conversation"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Message Stream Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
            >
              {/* Avatar */}
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${msg.role === 'user'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-purple-600/10 border border-purple-500/20 text-purple-600 dark:text-purple-400'
                  }`}
              >
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-2 max-w-[85%]">
                {/* Thinking Disclosure if model generated reasoning */}
                {msg.thinking && (
                  <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-2 text-xs">
                    <button
                      onClick={() => toggleThinking(msg.id)}
                      className="flex items-center justify-between w-full font-semibold text-purple-600 dark:text-purple-400 gap-2"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Thinking Process
                      </span>
                      {msg.showThinking ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                    {msg.showThinking && (
                      <div className="mt-2 pt-2 border-t border-purple-500/10 text-xs font-mono text-[var(--sea-ink-soft)] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                        {msg.thinking}
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[var(--chip-bg)] border border-[var(--chip-line)] text-[var(--sea-ink)]'
                    }`}
                >
                  {msg.content ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-[var(--sea-ink-soft)]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Generating response...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {chatError && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <span>{chatError}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        {messages.length <= 2 && (
          <div className="px-5 py-2 border-t border-[var(--line)] bg-[var(--header-bg)]/50 flex flex-wrap gap-2">
            <span className="text-[11px] font-medium text-[var(--sea-ink-soft)] self-center">
              Try asking:
            </span>
            {samplePrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                disabled={isGenerating || !isOllamaReady}
                className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1 text-xs text-[var(--sea-ink)] hover:border-purple-500/40 hover:text-purple-600 transition disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-[var(--line)] bg-[var(--header-bg)]">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={
                isOllamaReady
                  ? `Ask ${selectedModel || 'Ollama'} anything...`
                  : 'Start Ollama on host to begin chatting...'
              }
              disabled={isGenerating}
              className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--island-bg)] px-4 py-2.5 text-sm text-[var(--sea-ink)] placeholder-[var(--sea-ink-soft)] focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            />
            <button
              type="submit"
              disabled={isGenerating || !inputPrompt.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 shadow-sm"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Send</span>
                  <Send className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Connectivity & Architecture Status Cards */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {/* Bun API Server Card */}
        <StatusCard
          icon={<Server className="h-4 w-4 text-emerald-500" />}
          title="Bun API"
          isReady={isBackendReady}
          readyBadgeText="Online"
          notReadyBadgeText="Offline"
          notReadyBadgeVariant="rose"
          description={
            isBackendReady
              ? `Healthy on port 4000${latency ? ` (${latency}ms roundtrip)` : ''}`
              : `Cannot reach ${apiUrl}. Ensure the Bun server is running.`
          }
          footer="Docker / Local • Port 4000"
        />

        {/* PostgreSQL Database Card */}
        <StatusCard
          icon={<Database className="h-4 w-4 text-blue-500" />}
          title="PostgreSQL 16"
          isReady={isPostgresReady}
          readyBadgeText="Connected"
          notReadyBadgeText="Disconnected"
          notReadyBadgeVariant="amber"
          description={
            isPostgresReady
              ? 'PostgreSQL connected & healthy in Docker container.'
              : healthData?.services?.database?.message || 'Run "bun run docker:db"'
          }
          footer="Docker: myllama-postgres • Port 5432"
        />

        {/* Ollama AI Engine Card */}
        <StatusCard
          icon={<Cpu className="h-4 w-4 text-purple-500" />}
          title="Ollama (Host)"
          isReady={isOllamaReady}
          readyBadgeText="Connected"
          notReadyBadgeText="Offline"
          notReadyBadgeVariant="zinc"
          description={
            isOllamaReady
              ? `Connected (v${healthData?.services?.ollama?.version}). Model: ${selectedModel || 'detected'}`
              : 'Run "ollama serve" on your Mac host machine.'
          }
          footer="Host: localhost:11434 • Local inference"
        />
      </section>

      {/* Footer Navigation */}
      <section className="mt-8 flex justify-center text-xs">
        <a
          href="/about"
          className="inline-flex items-center gap-1 text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] hover:underline font-medium"
        >
          Read the complete MyLlama Architecture &amp; Design Spec <ExternalLink className="h-3 w-3" />
        </a>
      </section>
    </main>
  )
}
