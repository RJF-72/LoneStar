import { LlamaModel, LlamaContext, LlamaChatSession } from 'node-llama-cpp'
import { EventEmitter } from 'events'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import crypto from 'crypto'
import ModelCompressionSystem, { ModelMetadata } from './modelCompression.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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
  private compressionSystem: ModelCompressionSystem
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
    this.compressionSystem = ModelCompressionSystem.getInstance()
  }

  static getInstance(): ModelService {
    if (!ModelService.instance) {
      ModelService.instance = new ModelService()
    }
    return ModelService.instance
  }

  /**
   * Download and compress a model from the web
   */
  async downloadAndCompressModel(url: string): Promise<ModelMetadata> {
    console.log(`🚀 Downloading and compressing model from: ${url}`)
    return this.compressionSystem.downloadAndCompressModel(url)
  }

  /**
   * Load a compressed model for inference
   */
  async loadCompressedModel(modelId: string): Promise<void> {
    try {
      this.status = { status: 'connecting' }
      this.emit('statusChange', this.status)

      // Load compressed model
      const decompressedModel = await this.compressionSystem.loadCompressedModel(modelId)

      // Create LlamaModel from decompressed data
      this.model = new LlamaModel({
        modelPath: '', // Will use in-memory model
        gpuLayers: 32,
      })

      // Note: In a full implementation, we'd need to integrate with node-llama-cpp
      // to load models from memory buffers instead of files
      // For now, this is a placeholder

      this.context = new LlamaContext({
        model: this.model,
        contextSize: 2048,
        batchSize: 128,
      })

      this.chatSession = new LlamaChatSession({
        context: this.context,
        systemPrompt: this.config.systemPrompt,
      })

      const metadata = this.compressionSystem.getCompressedModels().find(m =>
        crypto.createHash('md5').update(m.originalUrl).digest('hex') === modelId
      )

      this.status = {
        status: 'connected',
        modelPath: `compressed:${modelId}`,
        loadedAt: new Date()
      }

      console.log(`✅ Compressed model loaded: ${metadata?.name || modelId}`)
      this.emit('statusChange', this.status)

    } catch (error) {
      console.error('❌ Failed to load compressed model:', error)
      this.status = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      this.emit('statusChange', this.status)
      throw error
    }
  }

  /**
   * Get list of compressed models
   */
  getCompressedModels(): ModelMetadata[] {
    return this.compressionSystem.getCompressedModels()
  }

  async initialize(modelPath?: string): Promise<void> {
    try {
      this.status = { status: 'connecting' }
      this.emit('statusChange', this.status)

      // Use provided path or environment variable
      const modelFilePath = modelPath || process.env.QWEN_MODEL_PATH

      if (!modelFilePath) {
        throw new Error('No Qwen model path provided. Please set QWEN_MODEL_PATH in .env file or provide modelPath parameter.')
      }

      // Resolve absolute path
      const absolutePath = path.isAbsolute(modelFilePath) 
        ? modelFilePath 
        : path.resolve(__dirname, '../../..', modelFilePath)

      console.log(`🤖 Loading Qwen3:4B model from: ${absolutePath}`)

      // Check if file exists
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`Model file not found: ${absolutePath}`)
      }

      // Load model with optimized settings for Qwen3:4B
      this.model = new LlamaModel({
        modelPath: absolutePath,
        gpuLayers: Number(process.env.GPU_LAYERS || '0'),
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

  async generateResponse(prompt: string, options?: {
    temperature?: number
    maxTokens?: number
    topP?: number
    topK?: number
    conversationHistory?: any[]
  }): Promise<string> {
    if (!this.chatSession) {
      throw new Error('Model not initialized. Call initialize() first.')
    }

    const config = {
      temperature: options?.temperature ?? this.config.temperature,
      maxTokens: options?.maxTokens ?? this.config.maxTokens,
      topP: options?.topP ?? this.config.topP,
      topK: options?.topK ?? this.config.topK,
    }

    try {
      // Build context-aware prompt
      let contextualPrompt = prompt
      
      if (options?.conversationHistory && options.conversationHistory.length > 0) {
        const historyContext = options.conversationHistory
          .slice(-5) // Last 5 messages for context
          .map((msg: any) => `${msg.role}: ${msg.content}`)
          .join('\n')
        
        contextualPrompt = `Previous conversation:\n${historyContext}\n\nCurrent question: ${prompt}`
      }

      const response = await this.chatSession.prompt(contextualPrompt, {
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        topP: config.topP,
        topK: config.topK,
      })

      return response
    } catch (error) {
      console.error('Error generating response:', error)
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async generateStreamResponse(
    prompt: string, 
    options?: {
      temperature?: number
      maxTokens?: number
      topP?: number
      topK?: number
      conversationHistory?: any[]
    },
    onToken?: (token: string) => void
  ): Promise<string> {
    if (!this.chatSession) {
      throw new Error('Model not initialized. Call initialize() first.')
    }

    const config = {
      temperature: options?.temperature ?? this.config.temperature,
      maxTokens: options?.maxTokens ?? this.config.maxTokens,
      topP: options?.topP ?? this.config.topP,
      topK: options?.topK ?? this.config.topK,
    }

    let fullResponse = ''

    try {
      // Build context-aware prompt
      let contextualPrompt = prompt
      
      if (options?.conversationHistory && options.conversationHistory.length > 0) {
        const historyContext = options.conversationHistory
          .slice(-5) // Last 5 messages for context
          .map((msg: any) => `${msg.role}: ${msg.content}`)
          .join('\n')
        
        contextualPrompt = `Previous conversation:\n${historyContext}\n\nCurrent question: ${prompt}`
      }

      const response = await this.chatSession.prompt(contextualPrompt, {
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        topP: config.topP,
        topK: config.topK,
      })

      // For now, return the full response (streaming can be added later with WebSocket)
      if (onToken) {
        onToken(response)
      }

      return response
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
        // Note: LlamaContext disposal is handled automatically by node-llama-cpp
        this.context = null
      }
      if (this.model) {
        // Note: LlamaModel disposal is handled automatically by node-llama-cpp  
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