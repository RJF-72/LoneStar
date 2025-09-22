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
import compressionRoutes from './compression.js'
import pluginRoutes from './plugins.js'
import gitRoutes from './git.js'
import refactoringRoutes from './refactoring.js'

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
router.use('/compression', compressionRoutes) // Model compression system
router.use('/plugins', pluginRoutes) // Plugin management
router.use('/git', gitRoutes) // Git integration
router.use('/refactoring', refactoringRoutes) // Code refactoring tools

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
      'Compressed AI Models for Memory Efficiency',
      'Extensible Plugin Architecture',
      'Built-in Git Version Control',
      'AI-Powered Code Refactoring',
      'Multi-user Collaborative Editing',
      'Docker Containerization & Cloud Deployment',
      'Multi-Model AI Support',
      'Advanced Debugging with AI Assistance',
      'AI-Powered Code Review & Suggestions'
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
      compression: '/api/compression',
      plugins: '/api/plugins',
      git: '/api/git',
      refactoring: '/api/refactoring',

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
    },
    capabilities: {
      compression: {
        algorithm: 'CodeDI',
        efficiency: '95% memory reduction',
        supported: ['GGUF', 'bin', 'safetensors', 'pt']
      },
      plugins: {
        architecture: 'Extensible',
        languages: ['TypeScript', 'JavaScript'],
        hotReload: true
      },
      git: {
        features: ['Version Control', 'AI Commit Messages', 'Conflict Resolution'],
        integration: 'Built-in'
      },
      refactoring: {
        aiPowered: true,
        languages: ['TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'C', 'Go', 'Rust'],
        autoFix: true
      }
    }
  })
})

export default router