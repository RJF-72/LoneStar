import { Router } from 'express'
import modelRoutes from './model.js'
import fileRoutes from './file.js'
import chatRoutes from './chat.js'
import projectRoutes from './project.js'
import cloudSyncRoutes from './cloudSync.js'
import distributedAIRoutes from './distributedAI.js'
import codeDIRoutes from './codeDI.js'
import zipRoutes from './zip.js'
import installerRoutes from './installer.js'
import fiberOpticsRoutes from './fiberOptics.js'
import aiRoutes from './ai.js'
import codeDITestingRoutes from './codeDITesting.js'

const router = Router()

// API Routes
router.use('/model', modelRoutes)
router.use('/projects', projectRoutes)
router.use('/files', fileRoutes)
router.use('/chat', chatRoutes)
router.use('/cloud-sync', cloudSyncRoutes)
router.use('/ai', distributedAIRoutes)
router.use('/simple-ai', aiRoutes) // Simple, user-friendly AI endpoint
router.use('/code-di', codeDIRoutes)
router.use('/zip', zipRoutes)
router.use('/installer', installerRoutes)
router.use('/fiber-optics', fiberOpticsRoutes) // Advanced technical metrics
router.use('/codedi-testing', codeDITestingRoutes) // Revolutionary architecture testing

// API Info
router.get('/', (req, res) => {
  res.json({
    name: 'LoneStar DI IDE API',
    version: '1.0.0',
    description: 'Revolutionary AI-Powered IDE with Simple, Fast Performance',
    features: [
      'Lightning-Fast AI Assistance',
      'Intelligent Code Analysis & Generation', 
      'Real-time Performance Optimization',
      'Advanced Project Management',
      'Professional Archive & Deployment Tools',
      'Cloud Synchronization',
      'Compressed AI Models for Memory Efficiency'
    ],
    endpoints: {
      // User-Friendly Endpoints
      ai: '/api/simple-ai',
      models: '/api/model',
      projects: '/api/projects', 
      files: '/api/files',
      chat: '/api/chat',
      cloudSync: '/api/cloud-sync',
      codeDI: '/api/code-di',
      zip: '/api/zip',
      installer: '/api/installer',
      
      // Advanced/Technical Endpoints
      distributedAI: '/api/ai',
      fiberOptics: '/api/fiber-optics',
      codeDITesting: '/api/codedi-testing' // Revolutionary architecture validation
    },
    architecture: {
      agents: 3,
      pipelinesPerAgent: 3,
      totalPipelines: 9,
      threadsPerPipeline: 50,
      nanobotsPerPipeline: '12,000+',
      totalNanobots: '108,000+'
    }
  })
})

export default router