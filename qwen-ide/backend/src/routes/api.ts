import { Router } from 'express'
import modelRoutes from './model'
import projectRoutes from './project'
import fileRoutes from './file'
import chatRoutes from './chat'

const router = Router()

// API Routes
router.use('/model', modelRoutes)
router.use('/projects', projectRoutes)
router.use('/files', fileRoutes)
router.use('/chat', chatRoutes)

// API Info
router.get('/', (req, res) => {
  res.json({
    name: 'Qwen IDE API',
    version: '1.0.0',
    description: 'Backend API for Qwen3:4B IDE',
    endpoints: {
      model: '/api/model',
      projects: '/api/projects',
      files: '/api/files',
      chat: '/api/chat'
    }
  })
})

export default router