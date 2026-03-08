import { AIProvider, AIMessage, AIStreamChunk, ToolDefinition } from './provider'

export class ClaudeProvider implements AIProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async chat(
    messages: AIMessage[],
    tools: ToolDefinition[],
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<string> {
    const systemMessage = messages.find(m => m.role === 'system')
    const chatMessages = messages.filter(m => m.role !== 'system')

    const body: any = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: chatMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }

    if (systemMessage) {
      body.system = systemMessage.content
    }

    if (tools.length > 0) {
      body.tools = tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }))
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error: ${response.status} ${error}`)
    }

    const data = await response.json()
    let fullText = ''

    for (const block of data.content) {
      if (block.type === 'text') {
        fullText += block.text
        onChunk({ type: 'text', content: block.text })
      } else if (block.type === 'tool_use') {
        onChunk({
          type: 'tool_call',
          toolCall: {
            name: block.name,
            arguments: block.input,
          },
        })
      }
    }

    onChunk({ type: 'done' })
    return fullText
  }
}
