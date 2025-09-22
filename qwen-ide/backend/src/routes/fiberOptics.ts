import { Router } from 'express'
import { DistributedIntelligenceSystem } from '../services/distributedIntelligence.js'

const router = Router()
const diSystem = DistributedIntelligenceSystem.getInstance()

// Get fiber optic pipeline system metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = diSystem.getFiberOpticMetrics()
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting fiber optic metrics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get fiber optic metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get comprehensive system stats including fiber optics
router.get('/system', async (req, res) => {
  try {
    const stats = diSystem.getSystemStats()
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting system stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get system stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Process data through fiber optic pipelines
router.post('/process', async (req, res) => {
  try {
    const { type, payload, priority = 'medium', context = '' } = req.body

    const task = {
      id: `fiber-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type || 'analyze',
      priority,
      data: payload,
      context,
      createdAt: new Date()
    }

    const result = await diSystem.processTask(task)
    
    res.json({
      success: true,
      data: result,
      taskId: task.id,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error processing through fiber optics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process through fiber optics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get pipeline status for specific agent type
router.get('/pipelines/:agentType', async (req, res) => {
  try {
    const { agentType } = req.params
    const metrics = diSystem.getFiberOpticMetrics()
    
    if (!['analyzer', 'generator', 'optimizer'].includes(agentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid agent type',
        message: 'Agent type must be analyzer, generator, or optimizer'
      })
    }

    const agentPipelines = metrics.pipelineDistribution[agentType as keyof typeof metrics.pipelineDistribution]
    
    res.json({
      success: true,
      data: {
        agentType,
        pipelines: agentPipelines,
        count: agentPipelines.length,
        totalThroughput: agentPipelines.reduce((sum, p) => sum + p.throughput, 0),
        averageLatency: agentPipelines.reduce((sum, p) => sum + p.latency, 0) / agentPipelines.length,
        averageUtilization: agentPipelines.reduce((sum, p) => sum + p.utilizationRate, 0) / agentPipelines.length
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting pipeline status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get pipeline status',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Health check for fiber optic system
router.get('/health', async (req, res) => {
  try {
    const metrics = diSystem.getFiberOpticMetrics()
    
    const health = {
      status: 'healthy',
      systemLoad: metrics.systemLoad,
      totalThroughput: metrics.totalThroughput,
      averageLatency: metrics.averageLatency,
      bottleneckCount: metrics.bottlenecks.length,
      recommendations: metrics.recommendations.length,
      pipelinesActive: Object.values(metrics.pipelineDistribution).flat().filter(p => p.status === 'active').length,
      pipelinesTotal: Object.values(metrics.pipelineDistribution).flat().length
    }
    
    // Determine overall health status
    if (metrics.systemLoad > 90) {
      health.status = 'critical'
    } else if (metrics.systemLoad > 70 || metrics.bottlenecks.length > 3) {
      health.status = 'warning'
    } else if (metrics.averageLatency > 500) {
      health.status = 'degraded'
    }
    
    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error checking fiber optic health:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to check system health',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router