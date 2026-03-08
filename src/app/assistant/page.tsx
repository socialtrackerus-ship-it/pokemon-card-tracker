'use client'

import { useState, useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Message {
  role: 'user' | 'assistant'
  content: string
  toolResults?: any[]
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return
    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)
    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, conversationHistory: messages }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, toolResults: data.toolResults }])
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }])
    } finally { setLoading(false) }
  }

  const suggestions = [
    { label: 'Price check', prompt: 'What is Charizard worth right now?' },
    { label: 'Grading advice', prompt: 'Should I grade my cards?' },
    { label: 'Collection summary', prompt: 'Show my collection summary' },
    { label: 'Market trends', prompt: 'Show me trending cards' },
  ]

  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-display-lg">AI Tools</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Ask about cards, prices, your collection, or grading strategy</p>
      </div>

      <div className="surface-1 rounded-lg overflow-hidden h-[560px] flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <p className="text-[13px] text-[var(--text-secondary)] mb-5">Start a conversation or try a workflow:</p>
              <div className="grid grid-cols-2 gap-2 max-w-sm w-full">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setInput(s.prompt)}
                    className="surface-interactive rounded-lg px-3 py-2.5 text-left transition-all"
                  >
                    <p className="text-[12px] font-medium">{s.label}</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 truncate">{s.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3.5 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-[var(--brand)] text-white'
                    : 'surface-2'
                }`}>
                  <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  {msg.toolResults && msg.toolResults.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {msg.toolResults.map((tr: any, j: number) => (
                        <div key={j} className="bg-[var(--surface-0)] rounded p-2 text-[10px]">
                          <span className="brand-badge px-1.5 py-0.5 rounded text-[9px] font-medium">{tr.name}</span>
                          <pre className="mt-1 overflow-x-auto text-[var(--text-tertiary)] whitespace-pre-wrap">{JSON.stringify(tr.result, null, 2)}</pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="surface-2 rounded-lg px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] animate-pulse" style={{ animationDelay: '0.15s' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] animate-pulse" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-[var(--border-subtle)] p-3">
          <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Pokemon cards..."
              disabled={loading}
              className="flex-1 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-md px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--brand)] transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2 text-[12px] font-medium text-white bg-[var(--brand)] rounded-md hover:opacity-90 transition-opacity disabled:opacity-30"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
