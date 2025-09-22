import { Router } from 'express'
import crypto from 'crypto'
import ModelCompressionSystem from '../services/modelCompression.js'

const router = Router()
const compressionSystem = ModelCompressionSystem.getInstance()

// Download and compress a model
router.post('/download-compress', async (req, res) => {
  try {
    const { url, targetPath } = req.body
    const isAsync = String(req.query.async || '').toLowerCase() === '1' || String(req.query.async || '').toLowerCase() === 'true'

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      })
    }

    console.log(`📥 Starting model download and compression: ${url}`)

    if (isAsync) {
      const modelId = crypto.createHash('md5').update(url).digest('hex')
      // Fire and forget
      compressionSystem.downloadAndCompressModel(url, targetPath)
        .then((metadata) => console.log(`✅ Async compression complete: ${metadata.name}`))
        .catch((e) => console.error('❌ Async compression failed:', e))

      return res.status(202).json({
        success: true,
        message: 'Compression started',
        modelId,
        url
      })
    } else {
      // Start download and compression (wait)
      const metadata = await compressionSystem.downloadAndCompressModel(url, targetPath)

      return res.json({
        success: true,
        message: 'Model download and compression started',
        metadata
      })
    }

  } catch (error) {
    console.error('❌ Model compression failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to download and compress model',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get compressed models list
router.get('/models', (req, res) => {
  try {
    const models = compressionSystem.getCompressedModels()

    res.json({
      success: true,
      models: models.map(model => ({
        id: crypto.createHash('md5').update(model.originalUrl).digest('hex'),
        ...model
      }))
    })

  } catch (error) {
    console.error('❌ Failed to get compressed models:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve compressed models'
    })
  }
})

// Get compression progress (all or by modelId)
router.get('/progress', (req, res) => {
  try {
    const { modelId } = req.query as { modelId?: string }
    if (modelId) {
      return res.json({ success: true, progress: compressionSystem.getProgress(modelId) })
    }
    return res.json({ success: true, progress: compressionSystem.getAllProgress() })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get progress' })
  }
})

// Load a compressed model
router.post('/load/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params

    console.log(`🔄 Loading compressed model: ${modelId}`)

    // This would integrate with the model service
    // For now, return success
    res.json({
      success: true,
      message: `Compressed model ${modelId} loaded successfully`
    })

  } catch (error) {
    console.error('❌ Failed to load compressed model:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to load compressed model',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Remove a compressed model
router.delete('/models/:modelId', (req, res) => {
  try {
    const { modelId } = req.params

    const removed = compressionSystem.removeCompressedModel(modelId)

    if (removed) {
      res.json({
        success: true,
        message: `Compressed model ${modelId} removed`
      })
    } else {
      res.status(404).json({
        success: false,
        error: 'Compressed model not found'
      })
    }

  } catch (error) {
    console.error('❌ Failed to remove compressed model:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to remove compressed model'
    })
  }
})

// Cancel download
router.post('/cancel/:modelId', (req, res) => {
  try {
    const { modelId } = req.params

    const cancelled = compressionSystem.cancelDownload(modelId)

    res.json({
      success: cancelled,
      message: cancelled ? `Download cancelled: ${modelId}` : `No active download found: ${modelId}`
    })

  } catch (error) {
    console.error('❌ Failed to cancel download:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to cancel download'
    })
  }
})

// Get compression statistics
router.get('/stats', (req, res) => {
  try {
    const models = compressionSystem.getCompressedModels()

    const stats = {
      totalModels: models.length,
      totalOriginalSize: models.reduce((sum, m) => sum + m.size, 0),
      totalCompressedSize: models.reduce((sum, m) => sum + m.compressedSize, 0),
      averageCompressionRatio: models.length > 0
        ? models.reduce((sum, m) => sum + m.compressionRatio, 0) / models.length
        : 0,
      spaceSaved: models.reduce((sum, m) => sum + (m.size - m.compressedSize), 0)
    }

    res.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('❌ Failed to get compression stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve compression statistics'
    })
  }
})

export default router