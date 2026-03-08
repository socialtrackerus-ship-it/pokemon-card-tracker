import { AIProvider } from './provider'
import { ClaudeProvider } from './claude'
import { OpenAIProvider } from './openai'

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'claude'

  switch (provider) {
    case 'claude':
      if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set')
      return new ClaudeProvider(process.env.ANTHROPIC_API_KEY)
    case 'openai':
      if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set')
      return new OpenAIProvider(process.env.OPENAI_API_KEY)
    default:
      throw new Error(`Unknown AI provider: ${provider}`)
  }
}

export * from './provider'
export * from './tools'
export * from './prompts'
