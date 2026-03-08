export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ToolCall {
  name: string
  arguments: Record<string, any>
}

export interface ToolResult {
  name: string
  result: any
}

export interface AIStreamChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'done'
  content?: string
  toolCall?: ToolCall
  toolResult?: ToolResult
}

export interface AIProvider {
  chat(
    messages: AIMessage[],
    tools: ToolDefinition[],
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<string>
}

export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, any>
}
