import { Router } from 'express'
import modelRoutes from './model.js'
import projectRoutes from './project.js'
import fileRoutes from './file.js'
import chatRoutes from './chat.js'
import cloudSyncRoutes from './cloudSync.js'
import distributedAIRoutes from './distributedAI.js'
import codeDIRoutes from './codeDI.js'

const router = Router()

// API Routes
router.use('/model', modelRoutes)
router.use('/projects', projectRoutes)
router.use('/files', fileRoutes)
router.use('/chat', chatRoutes)
router.use('/cloud-sync', cloudSyncRoutes)
router.use('/ai', distributedAIRoutes)
router.use('/codedi', codeDIRoutes)

// API Info
router.get('/', (req, res) => {
  res.json({
    name: 'LoneStar DI IDE API',
    version: '1.0.0',
    description: 'Revolutionary Distributed Intelligence IDE with Multi-Agent System',
    features: [
      'Revolutionary CodeDI Compression System',
      'Distributed Intelligence System',
      'Multi-Agent Processing (Analyzer, Generator, Optimizer)',
      'Fiber Optic Pipelines',
      'Nanobot Swarms',
      'Compressed AI Models (7B, 13B, 30B+)',
      'Real-time Project Management',
      'Cloud Synchronization',
      'Advanced AI Chat'
    ],
    endpoints: {
      models: '/api/model',
      projects: '/api/projects', 
      files: '/api/files',
      chat: '/api/chat',
      cloudSync: '/api/cloud-sync',
      distributedAI: '/api/ai',
      codeDI: '/api/codedi'
    }
  })
})

export default router