import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { ModelService } from '../services/modelService.js'

const router = Router()

// In-memory storage (in production, use a database)
let conversations: any[] = []
let messages: any[] = []

// Get chat conversations
router.get('/conversations', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: conversations,
      message: 'Conversations retrieved successfully'
    })
  } catch (error) {
    console.error('Error getting conversations:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get conversations',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Create new conversation
router.post('/conversations', (req: Request, res: Response) => {
  try {
    const { title, systemPrompt } = req.body
    
    const conversation = {
      id: uuidv4(),
      title: title || 'New Conversation',
      createdAt: new Date(),
      updatedAt: new Date(),
      config: {
        temperature: 0.7,
        maxTokens: 2048,
        topP: 0.9,
        topK: 50,
        repeatPenalty: 1.1,
        systemPrompt: systemPrompt || 'You are a helpful AI assistant specialized in software development.'
      }
    }
    
    conversations.push(conversation)
    
    res.json({
      success: true,
      data: conversation,
      message: 'Conversation created successfully'
    })
  } catch (error) {
    console.error('Error creating conversation:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create conversation',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get conversation by ID
router.get('/conversations/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const conversation = conversations.find(c => c.id === id)
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
        message: `Conversation with ID ${id} not found`
      })
    }
    
    const conversationMessages = messages.filter(m => m.conversationId === id)
    
    res.json({
      success: true,
      data: {
        ...conversation,
        messages: conversationMessages
      },
      message: 'Conversation retrieved successfully'
    })
  } catch (error) {
    console.error('Error getting conversation:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Add message to conversation
router.post('/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { content, role = 'user', context } = req.body
    
    const conversation = conversations.find(c => c.id === id)
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
        message: `Conversation with ID ${id} not found`
      })
    }
    
    // Add user message
    const userMessage = {
      id: uuidv4(),
      conversationId: id,
      role,
      content,
      timestamp: new Date(),
      context
    }
    
    messages.push(userMessage)
    
    // Generate AI response if user message
    if (role === 'user') {
      const modelService = ModelService.getInstance()
      
      // Get conversation history for context
      const conversationMessages = messages
        .filter(m => m.conversationId === id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      
      // Build context including file content if provided
      let prompt = content
      if (context?.activeFile && context?.fileContent) {
        prompt = `Current file: ${context.activeFile}\n\nFile content:\n${context.fileContent}\n\nUser question: ${content}`
      }
      
      try {
        const aiResponse = await modelService.generateResponse(prompt, {
          temperature: conversation.config.temperature,
          maxTokens: conversation.config.maxTokens,
          conversationHistory: conversationMessages.slice(-10) // Last 10 messages for context
        })
        
        const assistantMessage = {
          id: uuidv4(),
          conversationId: id,
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date(),
          metadata: {
            model: 'qwen-3-4b',
            temperature: conversation.config.temperature,
            maxTokens: conversation.config.maxTokens
          }
        }
        
        messages.push(assistantMessage)
        
        // Update conversation timestamp
        conversation.updatedAt = new Date()
        
        res.json({
          success: true,
          data: {
            userMessage,
            assistantMessage
          },
          message: 'Messages added successfully'
        })
        
      } catch (aiError) {
        console.error('AI response error:', aiError)
        res.status(500).json({
          success: false,
          error: 'Failed to generate AI response',
          message: aiError instanceof Error ? aiError.message : 'AI model error',
          data: { userMessage }
        })
      }
    } else {
      res.json({
        success: true,
        data: { userMessage },
        message: 'Message added successfully'
      })
    }
    
  } catch (error) {
    console.error('Error adding message:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to add message',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Update conversation config
router.patch('/conversations/:id/config', (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const config = req.body
    
    const conversation = conversations.find(c => c.id === id)
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      })
    }
    
    conversation.config = { ...conversation.config, ...config }
    conversation.updatedAt = new Date()
    
    res.json({
      success: true,
      data: conversation,
      message: 'Conversation config updated successfully'
    })
  } catch (error) {
    console.error('Error updating conversation config:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update conversation config',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Delete conversation
router.delete('/conversations/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const conversationIndex = conversations.findIndex(c => c.id === id)
    if (conversationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      })
    }
    
    // Remove conversation and its messages
    conversations.splice(conversationIndex, 1)
    messages = messages.filter(m => m.conversationId !== id)
    
    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting conversation:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Direct chat endpoint (simplified)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, context } = req.body
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
        message: 'Please provide a message to chat'
      })
    }
    
    const modelService = ModelService.getInstance()
    
    // Build context-aware prompt
    let prompt = message
    if (context?.currentFile && context?.fileContent) {
      prompt = `Current file: ${context.currentFile}\n\nFile content:\n${context.fileContent}\n\nUser question: ${message}`
    } else if (context?.project) {
      prompt = `Project: ${context.project}\n\nUser question: ${message}`
    }
    
    const response = await modelService.generateResponse(prompt, {
      temperature: 0.7,
      maxTokens: 1000
    })
    
    res.json({
      success: true,
      data: {
        message: response,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error in direct chat:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router