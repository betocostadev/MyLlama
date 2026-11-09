import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Server,
  Database,
  Cpu,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
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
      models?: string[]
      message: string
    }
  }
}

interface OllamaModel {
  name: string
  size: number
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  thinking?: string
  showThinking?: boolean
}

export function Dashboard() {
  const [apiUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        (window as unknown as { __VITE_API_URL?: string }).__VITE_API_URL ||
        'http://localhost:4000'
      )
    }
    return 'http://localhost:4000'
  })

  // Connectivity state
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [healthData, setHealthData] = useState<HealthResponse | null>(null)
  const [models, setModels] = useState<OllamaModel[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [latency, setLatency] = useState<number | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '👋 Welcome to MyLlama! I am connected to your local Ollama instance through the Bun server. Type a message below or pick one of the sample prompts to test me.',
    },
  ])
  const [inputPrompt, setInputPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isGenerating])

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
          const list = modelsJson.models || []
          setModels(list)
          if (list.length > 0 && !selectedModel) {
            setSelectedModel(list[0].name)
          }
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
  }, [apiUrl, selectedModel])

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 8000)
    return () => clearInterval(interval)
  }, [checkHealth])

  const isPostgresReady = healthData?.services?.database?.status === 'connected'
  const isOllamaReady = healthData?.services?.ollama?.status === 'connected'
  const isBackendReady = backendStatus === 'online'

  // Submit prompt to Ollama via Bun server
  const handleSendMessage = async (promptToSend?: string) => {
    const text = (promptToSend || inputPrompt).trim()
    if (!text || isGenerating) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    }

    const assistantMsgId = (Date.now() + 1).toString()
    const placeholderAssistant: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      thinking: '',
      showThinking: false,
    }

    const newMessages = [...messages, userMessage]
    setMessages([...newMessages, placeholderAssistant])
    setInputPrompt('')
    setIsGenerating(true)
    setChatError(null)

    const payloadMessages = newMessages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.content }))

    try {
      // Stream response via SSE
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel || (models[0]?.name ?? 'gemma4:12b-mlx'),
          messages: payloadMessages,
          stream: true,
        }),
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errJson.error || `HTTP ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No readable response body received from server')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let streamBuffer = ''
      let accumulatedContent = ''
      let accumulatedThinking = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        streamBuffer += decoder.decode(value, { stream: true })
        const lines = streamBuffer.split('\n')
        streamBuffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue

          const jsonStr = trimmed.slice(5).trim()
          if (!jsonStr) continue

          try {
            const parsed = JSON.parse(jsonStr) as {
              content?: string
              thinking?: string
              done?: boolean
            }
            if (parsed.content) accumulatedContent += parsed.content
            if (parsed.thinking) accumulatedThinking += parsed.thinking

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? {
                      ...msg,
                      content: accumulatedContent,
                      thinking: accumulatedThinking,
                    }
                  : msg
              )
            )
          } catch {
            // Ignore partial parse errors
          }
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      setChatError(errMsg)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: `⚠️ Error contacting Ollama: ${errMsg}`,
              }
            : msg
        )
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleThinking = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, showThinking: !m.showThinking } : m))
    )
  }

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Chat cleared. Ask me anything!',
      },
    ])
    setChatError(null)
  }

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
            <p className="text-xs text-[var(--sea-ink-soft)]">
              Local Ollama &times; Bun Server &times; PostgreSQL in Docker
            </p>
          </div>
        </div>

        {/* Live Service Indicators */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Bun API */}
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium ${
              isBackendReady
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>Bun API: {isBackendReady ? 'Online (4000)' : 'Offline'}</span>
          </div>

          {/* PostgreSQL */}
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium ${
              isPostgresReady
                ? 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>PostgreSQL: {isPostgresReady ? 'Docker (5432)' : 'Disconnected'}</span>
          </div>

          {/* Ollama */}
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium ${
              isOllamaReady
                ? 'border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300'
                : 'border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Ollama: {isOllamaReady ? `Host (${models.length} model)` : 'Offline'}</span>
          </div>

          <button
            onClick={checkHealth}
            disabled={isRefreshing}
            title="Refresh service status"
            className="rounded-full border border-[var(--line)] bg-[var(--island-bg)] p-1.5 text-[var(--sea-ink)] hover:bg-[var(--chip-bg)] transition shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
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
              className={`flex gap-3 max-w-3xl ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.role === 'user'
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
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
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
              <AlertTriangle className="h-4 w-4 shrink-0" />
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
                onClick={() => handleSendMessage(prompt)}
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
              handleSendMessage()
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
        <article className="island-shell rounded-2xl p-4 border border-[var(--line)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-emerald-500" />
              <span className="font-bold text-xs text-[var(--sea-ink)]">Bun API</span>
            </div>
            {isBackendReady ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                <XCircle className="h-3 w-3" /> Offline
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--sea-ink-soft)] mb-2">
            {isBackendReady
              ? `Healthy on port 4000${latency ? ` (${latency}ms roundtrip)` : ''}`
              : `Cannot reach ${apiUrl}. Ensure the Bun server is running.`}
          </p>
          <div className="pt-2 border-t border-[var(--line)] text-[10px] text-[var(--sea-ink-soft)] font-mono">
            Docker / Local &bull; Port 4000
          </div>
        </article>

        {/* PostgreSQL Database Card */}
        <article className="island-shell rounded-2xl p-4 border border-[var(--line)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              <span className="font-bold text-xs text-[var(--sea-ink)]">PostgreSQL 16</span>
            </div>
            {isPostgresReady ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <AlertTriangle className="h-3 w-3" /> Disconnected
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--sea-ink-soft)] mb-2">
            {isPostgresReady
              ? 'PostgreSQL connected & healthy in Docker container.'
              : healthData?.services?.database?.message || 'Run "bun run docker:db"'}
          </p>
          <div className="pt-2 border-t border-[var(--line)] text-[10px] text-[var(--sea-ink-soft)] font-mono">
            Docker: myllama-postgres &bull; Port 5432
          </div>
        </article>

        {/* Ollama AI Engine Card */}
        <article className="island-shell rounded-2xl p-4 border border-[var(--line)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-500" />
              <span className="font-bold text-xs text-[var(--sea-ink)]">Ollama (Host)</span>
            </div>
            {isOllamaReady ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 bg-zinc-500/10 px-2 py-0.5 rounded-full">
                <AlertTriangle className="h-3 w-3" /> Offline
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--sea-ink-soft)] mb-2">
            {isOllamaReady
              ? `Connected (v${healthData?.services?.ollama?.version}). Model: ${selectedModel || 'detected'}`
              : 'Run "ollama serve" on your Mac host machine.'}
          </p>
          <div className="pt-2 border-t border-[var(--line)] text-[10px] text-[var(--sea-ink-soft)] font-mono">
            Host: localhost:11434 &bull; Local inference
          </div>
        </article>
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
