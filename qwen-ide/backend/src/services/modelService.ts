import { LlamaModel, LlamaContext, LlamaChatSession } from 'node-llama-cpp'
import { EventEmitter } from 'events'
import path from 'path'

export interface ModelConfig {
  temperature: number
  maxTokens: number
  topP: number
  topK: number
  repeatPenalty: number
  systemPrompt?: string
  modelPath?: string
}

export interface ModelStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  modelPath?: string
  error?: string
  loadedAt?: Date
}

export class ModelService extends EventEmitter {
  private static instance: ModelService
  private model: LlamaModel | null = null
  private context: LlamaContext | null = null
  private chatSession: LlamaChatSession | null = null
  private status: ModelStatus = { status: 'disconnected' }
  private config: ModelConfig = {
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    topK: 50,
    repeatPenalty: 1.1,
    systemPrompt: 'You are a helpful AI assistant specialized in software development.'
  }

  private constructor() {
    super()
  }

  static getInstance(): ModelService {
    if (!ModelService.instance) {
      ModelService.instance = new ModelService()
    }
    return ModelService.instance
  }

  async initialize(modelPath?: string): Promise<void> {
    try {
      this.status = { status: 'connecting' }
      this.emit('statusChange', this.status)

      // Use provided path or try to find Qwen model
      const modelFilePath = modelPath || 
        process.env.QWEN_MODEL_PATH || 
        this.findQwenModel()

      if (!modelFilePath) {
        throw new Error('No Qwen model found. Please provide a model path.')
      }

      console.log(`Loading Qwen model from: ${modelFilePath}`)

      // Load model
      this.model = new LlamaModel({
        modelPath: modelFilePath,
        gpuLayers: 32, // Adjust based on your GPU
      })

      // Create context
      this.context = new LlamaContext({
        model: this.model,
        contextSize: 4096,
        batchSize: 512,
      })

      // Create chat session
      this.chatSession = new LlamaChatSession({
        context: this.context,
        systemPrompt: this.config.systemPrompt,
      })

      this.status = {
        status: 'connected',
        modelPath: modelFilePath,
        loadedAt: new Date()
      }

      console.log('✅ Qwen model loaded successfully')
      this.emit('statusChange', this.status)

    } catch (error) {
      console.error('❌ Failed to load Qwen model:', error)
      this.status = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      this.emit('statusChange', this.status)
      throw error
    }
  }

  private findQwenModel(): string | null {
    // Try common paths where Qwen models might be located
    const commonPaths = [
      './models/qwen-4b-chat.gguf',
      './models/qwen2-4b-instruct.gguf',
      '~/models/qwen-4b-chat.gguf',
      '~/models/qwen2-4b-instruct.gguf',
      '/models/qwen-4b-chat.gguf',
      '/models/qwen2-4b-instruct.gguf',
    ]

    // For now, return null to force explicit model path
    // In a real implementation, you'd check if these files exist
    return null
  }

  async generateResponse(prompt: string, config?: Partial<ModelConfig>): Promise<string> {
    if (!this.chatSession) {
      throw new Error('Model not initialized. Call initialize() first.')
    }

    const finalConfig = { ...this.config, ...config }

    try {
      const response = await this.chatSession.prompt(prompt, {
        temperature: finalConfig.temperature,
        maxTokens: finalConfig.maxTokens,
        topP: finalConfig.topP,
        topK: finalConfig.topK,
        repeatPenalty: finalConfig.repeatPenalty,
      })

      return response
    } catch (error) {
      console.error('Error generating response:', error)
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async generateStreamResponse(
    prompt: string, 
    config?: Partial<ModelConfig>,
    onToken?: (token: string) => void
  ): Promise<string> {
    if (!this.chatSession) {
      throw new Error('Model not initialized. Call initialize() first.')
    }

    const finalConfig = { ...this.config, ...config }
    let fullResponse = ''

    try {
      const stream = this.chatSession.promptWithMeta(prompt, {
        temperature: finalConfig.temperature,
        maxTokens: finalConfig.maxTokens,
        topP: finalConfig.topP,
        topK: finalConfig.topK,
        repeatPenalty: finalConfig.repeatPenalty,
        onToken: (chunk) => {
          const token = chunk.token
          fullResponse += token
          if (onToken) {
            onToken(token)
          }
        }
      })

      await stream.result
      return fullResponse
    } catch (error) {
      console.error('Error generating stream response:', error)
      throw new Error(`Failed to generate stream response: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  updateConfig(newConfig: Partial<ModelConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // If system prompt changed and we have a chat session, recreate it
    if (newConfig.systemPrompt && this.context) {
      this.chatSession = new LlamaChatSession({
        context: this.context,
        systemPrompt: this.config.systemPrompt,
      })
    }
  }

  getStatus(): ModelStatus {
    return { ...this.status }
  }

  getConfig(): ModelConfig {
    return { ...this.config }
  }

  async dispose(): Promise<void> {
    try {
      if (this.chatSession) {
        this.chatSession = null
      }
      if (this.context) {
        this.context.dispose()
        this.context = null
      }
      if (this.model) {
        this.model.dispose()
        this.model = null
      }
      
      this.status = { status: 'disconnected' }
      this.emit('statusChange', this.status)
      
      console.log('🧹 Model resources cleaned up')
    } catch (error) {
      console.error('Error disposing model:', error)
    }
  }
}