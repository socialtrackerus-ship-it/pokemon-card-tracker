import { AIProvider, AIMessage, AIStreamChunk, ToolDefinition } from './provider'

export class OpenAIProvider implements AIProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async chat(
    messages: AIMessage[],
    tools: ToolDefinition[],
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<string> {
    const body: any = {
      model: 'gpt-4o',
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }

    if (tools.length > 0) {
      body.tools = tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }))
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${response.status} ${error}`)
    }

    const data = await response.json()
    const choice = data.choices[0]
    const message = choice.message
    let fullText = message.content || ''

    if (fullText) {
      onChunk({ type: 'text', content: fullText })
    }

    if (message.tool_calls) {
      for (const tc of message.tool_calls) {
        onChunk({
          type: 'tool_call',
          toolCall: {
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments),
          },
        })
      }
    }

    onChunk({ type: 'done' })
    return fullText
  }
}
