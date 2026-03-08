'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
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
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to get response')
      }

      const data = await res.json()
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          toolResults: data.toolResults,
        },
      ])
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Sorry, I encountered an error: ${err.message}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="text-gradient">AI</span> Assistant
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          Ask about Pokemon cards, prices, your collection, or grading advice
        </p>
      </div>

      <div className="relative rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden h-[600px] flex flex-col">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[var(--holo-purple)] opacity-[0.02] blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[var(--holo-blue)] opacity-[0.02] blur-[80px] pointer-events-none" />

        <ScrollArea className="flex-1 p-5" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--holo-purple)] to-[var(--holo-blue)] flex items-center justify-center mx-auto mb-5 opacity-70">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                  <path d="M10 22h4" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold mb-2">Welcome to PokeVault AI</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Ask me about Pokemon cards, prices, your collection, or grading advice
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                {[
                  'Show me trending cards',
                  'What is Charizard worth?',
                  'Show my collection summary',
                  'Should I grade my cards?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    className="px-3 py-1.5 text-xs font-medium rounded-full border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 hover:border-white/20 transition-all"
                    onClick={() => setInput(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-scale-in`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-[var(--holo-purple)] to-[var(--holo-blue)] text-white'
                      : 'bg-white/5 border border-white/5'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>

                  {/* Tool Results */}
                  {message.toolResults && message.toolResults.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.toolResults.map((tr: any, j: number) => (
                        <div key={j} className="bg-black/20 rounded-xl p-3 text-xs">
                          <Badge variant="secondary" className="mb-1.5 text-[10px] bg-white/10 border-white/10">{tr.name}</Badge>
                          <pre className="overflow-x-auto whitespace-pre-wrap text-muted-foreground">
                            {JSON.stringify(tr.result, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-scale-in">
                <div className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[var(--holo-purple)] animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-[var(--holo-blue)] animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 rounded-full bg-[var(--holo-cyan)] animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-white/5 p-4 bg-white/[0.01]">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Pokemon cards..."
              disabled={loading}
              className="flex-1 bg-white/5 border-white/10 focus:border-[var(--holo-purple)]/50 rounded-xl"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-[var(--holo-purple)] to-[var(--holo-blue)] text-white border-0 rounded-xl px-5 disabled:opacity-30"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
