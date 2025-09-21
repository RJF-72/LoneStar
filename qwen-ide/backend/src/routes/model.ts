import { Router, Request, Response } from 'express'
import { ModelService } from '../services/modelService'

const router = Router()

// Get model status
router.get('/status', (req: Request, res: Response) => {
  try {
    const modelService = ModelService.getInstance()
    const status = modelService.getStatus()
    res.json({
      success: true,
      data: status
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get model status',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get model configuration
router.get('/config', (req: Request, res: Response) => {
  try {
    const modelService = ModelService.getInstance()
    const config = modelService.getConfig()
    res.json({
      success: true,
      data: config
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get model config',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Update model configuration
router.put('/config', async (req: Request, res: Response) => {
  try {
    const modelService = ModelService.getInstance()
    const { temperature, maxTokens, topP, topK, repeatPenalty, systemPrompt } = req.body

    const config = {
      ...(temperature !== undefined && { temperature }),
      ...(maxTokens !== undefined && { maxTokens }),
      ...(topP !== undefined && { topP }),
      ...(topK !== undefined && { topK }),
      ...(repeatPenalty !== undefined && { repeatPenalty }),
      ...(systemPrompt !== undefined && { systemPrompt }),
    }

    modelService.updateConfig(config)
    
    res.json({
      success: true,
      data: modelService.getConfig(),
      message: 'Model configuration updated'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update model config',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Initialize/reload model
router.post('/initialize', async (req: Request, res: Response) => {
  try {
    const modelService = ModelService.getInstance()
    const { modelPath } = req.body

    await modelService.initialize(modelPath)
    
    res.json({
      success: true,
      data: modelService.getStatus(),
      message: 'Model initialized successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to initialize model',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Generate text (non-streaming)
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const modelService = ModelService.getInstance()
    const { prompt, config } = req.body

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      })
    }

    const response = await modelService.generateResponse(prompt, config)
    
    res.json({
      success: true,
      data: {
        response,
        prompt,
        config: modelService.getConfig()
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate response',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Dispose model
router.post('/dispose', async (req: Request, res: Response) => {
  try {
    const modelService = ModelService.getInstance()
    await modelService.dispose()
    
    res.json({
      success: true,
      message: 'Model disposed successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to dispose model',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router