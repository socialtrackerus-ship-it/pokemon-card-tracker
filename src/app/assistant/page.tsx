'use client'

import { useState, useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Message {
  role: 'user' | 'assistant'
  content: string
  toolResults?: ToolResult[]
}

interface ToolResult {
  name: string
  result: unknown
}

interface Workflow {
  id: string
  label: string
  description: string
  prompt: string
  icon: React.ReactNode
}

const workflows: Workflow[] = [
  {
    id: 'price',
    label: 'Price Check',
    description: 'Look up current market prices',
    prompt: 'What is the current market price for ',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
  },
  {
    id: 'grade',
    label: 'Grade Advisor',
    description: 'Get grading recommendations',
    prompt: 'Should I grade my card? Here are the details: ',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    id: 'analysis',
    label: 'Collection Analysis',
    description: 'Analyze your portfolio value',
    prompt: 'Analyze my collection and give me insights on value, diversification, and recommendations.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  },
  {
    id: 'trends',
    label: 'Market Trends',
    description: 'See what\u2019s trending now',
    prompt: 'What are the current market trends for Pokemon cards? Which cards are going up in value?',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
]

const suggestions = [
  { label: 'Price check', prompt: 'What is Charizard VMAX worth right now?' },
  { label: 'Grading advice', prompt: 'Is it worth grading my near-mint Pikachu VMAX?' },
  { label: 'Collection summary', prompt: 'Show me a summary of my collection value and top cards' },
  { label: 'Market trends', prompt: 'What Pokemon cards are trending up in value this month?' },
]

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  async function handleSend(messageOverride?: string) {
    const userMessage = (messageOverride || input).trim()
    if (!userMessage || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)
    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, conversationHistory: messages }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to get response')
      }
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        toolResults: data.toolResults,
      }])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setMessages(prev => [...prev, { role: 'assistant', content: `I encountered an error: ${message}. Please try again.` }])
    } finally {
      setLoading(false)
    }
  }

  function handleWorkflow(workflow: Workflow) {
    setInput(workflow.prompt)
    inputRef.current?.focus()
  }

  function handleNewChat() {
    setMessages([])
    setInput('')
    setExpandedTools({})
  }

  function toggleToolResult(key: string) {
    setExpandedTools(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar — hidden on mobile */}
      <aside className="hidden md:flex flex-col w-60 surface-1 border-r border-[var(--border-subtle)] shrink-0">
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-display-sm font-display">AI Tools</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {workflows.map((wf) => (
            <button
              key={wf.id}
              onClick={() => handleWorkflow(wf)}
              className="surface-interactive w-full rounded-lg px-3 py-2.5 text-left transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[var(--text-secondary)] group-hover:text-[var(--brand)] transition-colors shrink-0">
                  {wf.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold">{wf.label}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 truncate">{wf.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-[var(--border-subtle)]">
          <button onClick={handleNewChat} className="btn-ghost w-full text-[12px] flex items-center justify-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            New Chat
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] surface-1">
          <h2 className="text-display-sm font-display">AI Tools</h2>
          <button onClick={handleNewChat} className="btn-ghost text-[11px]">New Chat</button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-20 animate-in">
                <div className="empty-state-icon mb-4">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 6V2H8" />
                    <path d="m8 18-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z" />
                    <path d="M2 12h2" />
                    <path d="M9 11v2" />
                    <path d="M15 11v2" />
                    <path d="M20 12h2" />
                  </svg>
                </div>
                <h3 className="text-display-sm font-display">Ask me anything about Pokemon cards</h3>
                <p className="text-[13px] text-[var(--text-secondary)] mt-2 mb-8 text-center max-w-sm">
                  Price lookups, grading advice, portfolio analysis, and market insights.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md">
                  {suggestions.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => handleSend(s.prompt)}
                      className="surface-interactive rounded-xl px-4 py-3 text-left transition-all hover-lift"
                    >
                      <p className="text-[12px] font-semibold">{s.label}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 line-clamp-2">{s.prompt}</p>
                    </button>
                  ))}
                </div>

                {/* Mobile Workflow Grid */}
                <div className="md:hidden mt-8 w-full">
                  <p className="text-eyebrow mb-3 text-center">WORKFLOWS</p>
                  <div className="grid grid-cols-2 gap-2">
                    {workflows.map((wf) => (
                      <button
                        key={wf.id}
                        onClick={() => handleWorkflow(wf)}
                        className="surface-interactive rounded-lg px-3 py-2.5 text-left transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--text-secondary)] shrink-0">{wf.icon}</span>
                          <span className="text-[11px] font-medium">{wf.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-[var(--brand)] text-white'
                          : 'surface-2'
                      }`}
                    >
                      <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                      {/* Tool Results */}
                      {msg.toolResults && msg.toolResults.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.toolResults.map((tr, j) => {
                            const key = `${i}-${j}`
                            const isExpanded = expandedTools[key]
                            return (
                              <div key={j} className="rounded-lg overflow-hidden bg-[var(--surface-0)]">
                                <button
                                  onClick={() => toggleToolResult(key)}
                                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[var(--surface-1)] transition-colors"
                                >
                                  <span className="brand-badge text-[10px] px-2 py-0.5 rounded font-medium">{tr.name}</span>
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  >
                                    <polyline points="6 9 12 15 18 9" />
                                  </svg>
                                </button>
                                {isExpanded && (
                                  <div className="px-3 pb-2">
                                    <pre className="text-[10px] text-[var(--text-tertiary)] whitespace-pre-wrap overflow-x-auto">
                                      {JSON.stringify(tr.result, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading */}
                {loading && (
                  <div className="flex justify-start">
                    <div className="surface-2 rounded-xl px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-pulse" />
                        <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-pulse" style={{ animationDelay: '0.15s' }} />
                        <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-pulse" style={{ animationDelay: '0.3s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Bar */}
        <div className="border-t border-[var(--border-subtle)] surface-1 px-4 py-3">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend() }}
            className="max-w-3xl mx-auto flex gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about prices, grading, or your collection..."
              disabled={loading}
              className="input-premium flex-1"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary px-4 flex items-center gap-1.5 shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 7-7 7 7" />
                <path d="M12 19V5" />
              </svg>
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
