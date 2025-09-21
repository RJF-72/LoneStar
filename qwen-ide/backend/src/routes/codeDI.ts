import { Router, Request, Response } from 'express'
import codeDI from '../services/codeDI.js'

const router = Router()

// Initialize CodeDI Engine
router.post('/initialize', async (req: Request, res: Response) => {
  try {
    await codeDI.initialize()
    const metrics = codeDI.getMetrics()
    
    return res.json({
      success: true,
      data: metrics,
      message: 'CodeDI Engine initialized successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to initialize CodeDI Engine',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get CodeDI system metrics and status
router.get('/metrics', (req: Request, res: Response) => {
  try {
    const metrics = codeDI.getMetrics()
    
    return res.json({
      success: true,
      data: {
        ...metrics,
        description: 'Revolutionary CodeDI compression system maintaining full functionality',
        features: [
          'Compressed models, agents, and systems remain fully usable',
          'Edit code directly in compressed containers',
          'Execute operations on compressed data',
          'Massive memory savings enable larger AI models',
          'Virtual memory mapping for seamless operation'
        ]
      },
      message: 'CodeDI metrics retrieved successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get CodeDI metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Compress an item into CodeDI container
router.post('/compress', async (req: Request, res: Response) => {
  try {
    const { 
      source, 
      type, 
      name, 
      compressionLevel = 'balanced',
      maintainEditability = true,
      enableVirtualExecution = true 
    } = req.body
    
    if (!source || !type || !name) {
      return res.status(400).json({
        success: false,
        error: 'Source, type, and name are required'
      })
    }
    
    const containerId = await codeDI.compressToCodeDI(source, type, name, {
      compressionLevel,
      maintainEditability,
      enableVirtualExecution
    })
    
    const container = codeDI.listContainers().find(c => c.id === containerId)
    
    return res.json({
      success: true,
      data: {
        containerId,
        container,
        compressionInfo: {
          originalSize: container?.originalSize || 0,
          compressedSize: container?.compressedSize || 0,
          compressionRatio: container?.compressionRatio || 0,
          memorySaved: (container?.originalSize || 0) - (container?.compressedSize || 0)
        }
      },
      message: `Successfully compressed "${name}" into CodeDI container`
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to compress into CodeDI',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Activate a CodeDI container
router.post('/activate/:containerId', async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params
    
    await codeDI.activateCodeDI(containerId)
    const containers = codeDI.listContainers()
    const container = containers.find(c => c.id === containerId)
    
    return res.json({
      success: true,
      data: container,
      message: `CodeDI container activated and ready for compressed execution`
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to activate CodeDI container',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Execute operation in CodeDI container
router.post('/execute/:containerId', async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params
    const { operation, params = {} } = req.body
    
    if (!operation) {
      return res.status(400).json({
        success: false,
        error: 'Operation is required'
      })
    }
    
    const result = await codeDI.executeInCodeDI(containerId, operation, params)
    
    return res.json({
      success: true,
      data: {
        result,
        executionInfo: {
          containerId,
          operation,
          executedOnCompressed: true,
          memoryEfficient: true
        }
      },
      message: `Operation executed successfully on compressed CodeDI container`
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to execute in CodeDI container',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Edit code in CodeDI container (without decompressing)
router.post('/edit/:containerId', async (req: Request, res: Response) => {
  try {
    const { containerId } = req.params
    const { edits } = req.body
    
    if (!Array.isArray(edits)) {
      return res.status(400).json({
        success: false,
        error: 'Edits must be an array'
      })
    }
    
    await codeDI.editInCodeDI(containerId, edits)
    const containers = codeDI.listContainers()
    const container = containers.find(c => c.id === containerId)
    
    return res.json({
      success: true,
      data: container,
      message: `Successfully edited compressed CodeDI container without decompression`
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to edit CodeDI container',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Load large AI model as CodeDI
router.post('/load-large-model', async (req: Request, res: Response) => {
  try {
    const { 
      modelPath, 
      modelSize, 
      compressionLevel = 'maximum' 
    } = req.body
    
    if (!modelPath || !modelSize) {
      return res.status(400).json({
        success: false,
        error: 'Model path and size are required'
      })
    }
    
    const containerId = await codeDI.loadLargeModelAsCodeDI(modelPath, modelSize, compressionLevel)
    const container = codeDI.listContainers().find(c => c.id === containerId)
    
    return res.json({
      success: true,
      data: {
        containerId,
        container,
        modelInfo: {
          size: modelSize,
          path: modelPath,
          compressionLevel,
          memoryEfficiency: `${((container?.compressionRatio || 1) * 100).toFixed(1)}% memory saved`
        }
      },
      message: `${modelSize} model loaded as CodeDI with massive memory savings`
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to load large model as CodeDI',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// List all CodeDI containers
router.get('/containers', (req: Request, res: Response) => {
  try {
    const containers = codeDI.listContainers()
    const metrics = codeDI.getMetrics()
    
    return res.json({
      success: true,
      data: {
        containers,
        summary: {
          totalContainers: containers.length,
          activeContainers: containers.filter(c => c.isActive).length,
          totalMemorySaved: metrics.compressionSavings,
          averageCompressionRatio: containers.length > 0 
            ? containers.reduce((sum, c) => sum + c.compressionRatio, 0) / containers.length 
            : 0
        }
      },
      message: 'CodeDI containers listed successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to list CodeDI containers',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get specific container details
router.get('/containers/:containerId', (req: Request, res: Response) => {
  try {
    const { containerId } = req.params
    const containers = codeDI.listContainers()
    const container = containers.find(c => c.id === containerId)
    
    if (!container) {
      return res.status(404).json({
        success: false,
        error: 'CodeDI container not found'
      })
    }
    
    return res.json({
      success: true,
      data: {
        container,
        capabilities: [
          'Execute operations without decompression',
          'Edit code directly in compressed state',
          'Virtual memory mapping for seamless operation',
          'Massive memory savings',
          'Full functionality preserved'
        ]
      },
      message: 'Container details retrieved successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get container details',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router