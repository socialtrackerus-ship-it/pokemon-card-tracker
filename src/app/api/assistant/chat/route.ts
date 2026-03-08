import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { getAIProvider, AI_TOOLS, executeTool, SYSTEM_PROMPT } from '@/lib/ai'
import { AIMessage, AIStreamChunk } from '@/lib/ai/provider'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, conversationHistory = [] } = await request.json()

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  try {
    const provider = getAIProvider()

    const messages: AIMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    const chunks: AIStreamChunk[] = []
    let responseText = ''

    const text = await provider.chat(messages, AI_TOOLS, (chunk) => {
      chunks.push(chunk)
    })

    responseText = text

    const toolCalls = chunks.filter(c => c.type === 'tool_call')
    const toolResults: any[] = []

    for (const tc of toolCalls) {
      if (tc.toolCall) {
        const args = { ...tc.toolCall.arguments }
        if (['get_collection_summary', 'add_to_collection', 'remove_from_collection'].includes(tc.toolCall.name)) {
          args.user_id = session.user.id
        }

        const result = await executeTool(tc.toolCall.name, args)
        toolResults.push({
          name: tc.toolCall.name,
          arguments: tc.toolCall.arguments,
          result,
        })
      }
    }

    if (toolResults.length > 0) {
      const followUpMessages: AIMessage[] = [
        ...messages,
        { role: 'assistant', content: responseText || 'Let me look that up for you.' },
        {
          role: 'user',
          content: `Tool results:\n${JSON.stringify(toolResults, null, 2)}\n\nPlease provide a helpful response based on these results.`,
        },
      ]

      responseText = await provider.chat(followUpMessages, [], () => {})
    }

    return NextResponse.json({
      response: responseText,
      toolResults,
    })
  } catch (err: any) {
    console.error('AI chat error:', err)
    return NextResponse.json({ error: err.message || 'AI error' }, { status: 500 })
  }
}
