import { Router, Request, Response } from 'express'
import distributedIntelligence from '../services/distributedIntelligence.js'
import { ModelService } from '../services/modelService.js'

const router = Router()

// Initialize the distributed intelligence system
router.post('/initialize', async (req: Request, res: Response) => {
  try {
    await distributedIntelligence.initialize()
    const stats = distributedIntelligence.getSystemStats()
    
    return res.json({
      success: true,
      data: stats,
      message: 'Distributed Intelligence System initialized successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to initialize distributed intelligence system',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get system status and statistics
router.get('/status', (req: Request, res: Response) => {
  try {
    const stats = distributedIntelligence.getSystemStats()
    
    return res.json({
      success: true,
      data: {
        ...stats,
        description: 'Revolutionary multi-agent system with fiber optic pipelines and nanobot swarms',
        architecture: {
          agents: 3,
          pipelinesPerAgent: 3,
          threadsPerPipeline: 50,
          nanobotsPerPipeline: '12,000+',
          totalProcessingUnits: '450+ threads, 108,000+ nanobots'
        }
      },
      message: 'System status retrieved successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get system status',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Analyze code using the analyzer agent
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { code, context, fileName } = req.body
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Code is required for analysis'
      })
    }
    
    const analysisContext = `File: ${fileName || 'unknown'}\nContext: ${context || 'General code analysis'}`
    const result = await distributedIntelligence.analyzeCode(code, analysisContext)
    
    return res.json({
      success: true,
      data: {
        analysis: result,
        processingInfo: {
          systemUsed: 'Distributed Intelligence System',
          agentType: 'Analyzer',
          nanobots: 'Multiple nanobots used for parallel analysis'
        }
      },
      message: 'Code analysis completed successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Code analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Generate code using the generator agent
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { description, context, language, framework } = req.body
    
    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Description is required for code generation'
      })
    }
    
    const generationContext = `Language: ${language || 'auto-detect'}\nFramework: ${framework || 'none'}\nContext: ${context || 'General code generation'}`

    // Ensure the main model is connected for real generation
    const modelService = ModelService.getInstance()
    const status = modelService.getStatus()
    if (status.status !== 'connected') {
      return res.status(503).json({
        success: false,
        error: 'Model not connected',
        hint: 'POST /api/model/initialize with { modelPath } or set QWEN_MODEL_PATH and restart'
      })
    }

    // Build a concise prompt for code generation
    const prompt = [
      'You are Qwen Coder. Generate code based on the request.',
      `Description: ${description}`,
      generationContext,
      'Return only code unless comments are requested.'
    ].join('\n')

    // Run DI pipeline for metrics, but return real model output
    const diResult = await distributedIntelligence.generateCode(description, generationContext)
    const generatedText = await modelService.generateResponse(prompt, { maxTokens: 1024 })

    return res.json({
      success: true,
      data: {
        generatedText,
        di: { processingInfo: diResult, note: 'DI pipeline executed for metrics; text is from the model' }
      },
      message: 'Code generation completed successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Code generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Optimize code using the optimizer agent
router.post('/optimize', async (req: Request, res: Response) => {
  try {
    const { code, context, optimizationType } = req.body
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Code is required for optimization'
      })
    }
    
    const optimizationContext = `Optimization Type: ${optimizationType || 'general'}\nContext: ${context || 'General code optimization'}`
    const result = await distributedIntelligence.optimizeCode(code, optimizationContext)
    
    return res.json({
      success: true,
      data: {
        optimized: result,
        processingInfo: {
          systemUsed: 'Distributed Intelligence System',
          agentType: 'Optimizer',
          nanobots: 'Multiple nanobots used for parallel optimization'
        }
      },
      message: 'Code optimization completed successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Code optimization failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get real-time performance metrics
router.get('/metrics', (req: Request, res: Response) => {
  try {
    const stats = distributedIntelligence.getSystemStats()
    
    return res.json({
      success: true,
      data: {
        performance: stats.performance,
        system: {
          agents: stats.agents,
          pipelines: stats.pipelines,
          threads: stats.threads,
          nanobots: stats.nanobots
        },
        realTimeMetrics: {
          memoryEfficiency: `${((1 - stats.performance.memoryUsage / 1000) * 100).toFixed(1)}%`,
          systemLoad: `${(stats.performance.systemLoad * 100).toFixed(1)}%`,
          bottleneckStatus: stats.performance.bottleneckCount === 0 ? 'Optimal' : `${stats.performance.bottleneckCount} detected`,
          averageResponseTime: `${stats.performance.averageResponseTime.toFixed(2)}ms`
        },
        timestamp: stats.timestamp
      },
      message: 'Real-time metrics retrieved successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Advanced multi-task processing (utilize all agents simultaneously)
router.post('/multi-task', async (req: Request, res: Response) => {
  try {
    const { tasks } = req.body
    
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tasks array is required'
      })
    }
    
    // Process multiple tasks in parallel using all agents
    const promises = tasks.map(async (task) => {
      switch (task.type) {
        case 'analyze':
          return await distributedIntelligence.analyzeCode(task.code, task.context)
        case 'generate':
          return await distributedIntelligence.generateCode(task.description, task.context)
        case 'optimize':
          return await distributedIntelligence.optimizeCode(task.code, task.context)
        default:
          throw new Error(`Unknown task type: ${task.type}`)
      }
    })
    
    const results = await Promise.all(promises)
    
    return res.json({
      success: true,
      data: {
        results: results,
        processed: results.length,
        processingInfo: {
          systemUsed: 'Distributed Intelligence System - Multi-Agent Processing',
          parallelExecution: true,
          nanobotsUsed: 'All available nanobots across all pipelines'
        }
      },
      message: `Successfully processed ${results.length} tasks in parallel`
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Multi-task processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// WebSocket endpoint for real-time system monitoring
router.get('/monitor', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Real-time monitoring available via WebSocket',
    websocket: {
      endpoint: '/ws',
      events: [
        'system:initialized',
        'task:completed',
        'task:failed',
        'system:metrics',
        'bottleneck:detected',
        'performance:optimized'
      ]
    }
  })
})

export default router