import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import dotenv from 'dotenv'
import apiRoutes from './routes/api.js'
import { setupWebSocket } from './services/websocket.js'
import { ModelService } from './services/modelService.js'
import ModelCompressionSystem from './services/modelCompression.js'
import PluginSystem from './services/pluginSystem.js'
import GitIntegration from './services/gitIntegration.js'
import CodeRefactoringTools from './services/codeRefactoring.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 8000

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}))
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Routes
app.use('/api', apiRoutes)

// Health check endpoint
app.get('/health', (req, res) => {
  const modelService = ModelService.getInstance()
  const compressionSystem = ModelCompressionSystem.getInstance()
  const pluginSystem = PluginSystem.getInstance()
  const gitIntegration = GitIntegration.getInstance()
  const refactoringTools = CodeRefactoringTools.getInstance()

  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      model: modelService.getStatus(),
      compression: {
        available: true,
        compressedModels: compressionSystem.getCompressedModels().length
      },
      plugins: {
        available: true,
        installed: pluginSystem.getInstalledPlugins().length
      },
      git: {
        available: true,
        initialized: true
      },
      refactoring: {
        available: true,
        options: refactoringTools.getOptions()
      }
    }
  })
})

// Create HTTP server
const server = createServer(app)

// Setup WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' })
setupWebSocket(wss)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  })
})

// Start server
server.listen(PORT, async () => {
  console.log(`🚀 LoneStar DI IDE Backend running on http://localhost:${PORT}`)
  console.log(`📡 WebSocket server available at ws://localhost:${PORT}/ws`)
  
  try {
    // Initialize core services
    console.log('🔧 Initializing services...')
    
    const modelService = ModelService.getInstance()
    const compressionSystem = ModelCompressionSystem.getInstance()
    const pluginSystem = PluginSystem.getInstance()
    const gitIntegration = GitIntegration.getInstance()
    const refactoringTools = CodeRefactoringTools.getInstance()
    
    // Initialize model service (skip if SKIP_MODEL_LOAD is set)
    if (!process.env.SKIP_MODEL_LOAD) {
      await modelService.initialize()
    } else {
      console.log('⏭️ Skipping model loading (SKIP_MODEL_LOAD=true)')
    }
    
    // Initialize Git repository if not already done
    if (await gitIntegration.isGitAvailable() && !(await gitIntegration.isRepository())) {
      await gitIntegration.initRepository()
    }
    
    console.log('✅ All services initialized successfully')
    console.log('🎯 LoneStar DI IDE is ready with:')
    console.log('   • Distributed Intelligence System')
    console.log('   • CodeDI Compression Engine')
    console.log('   • Plugin Architecture')
    console.log('   • Git Integration')
    console.log('   • AI-Powered Code Refactoring')
    
  } catch (error) {
    console.error('❌ Service initialization failed:', error)
    console.log('⚠️ Server started but some services may not be available')
  }
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down gracefully...')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

export default app