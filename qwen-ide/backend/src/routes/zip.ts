import { Router, Request, Response } from 'express'
import zipService from '../services/zipService.js'
import path from 'path'

const router = Router()

// Create zip archive
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { sourcePath, outputPath, options = {} } = req.body
    
    if (!sourcePath || !outputPath) {
      return res.status(400).json({
        success: false,
        error: 'Source path and output path are required'
      })
    }

    await zipService.createZip(sourcePath, outputPath, options)
    
    res.json({
      success: true,
      data: { zipPath: outputPath },
      message: 'Zip archive created successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create zip archive',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Extract zip archive
router.post('/extract', async (req: Request, res: Response) => {
  try {
    const { zipPath, outputPath } = req.body
    
    if (!zipPath || !outputPath) {
      return res.status(400).json({
        success: false,
        error: 'Zip path and output path are required'
      })
    }

    await zipService.extractZip(zipPath, outputPath)
    
    res.json({
      success: true,
      data: { extractPath: outputPath },
      message: 'Zip archive extracted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to extract zip archive',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// List zip contents
router.get('/contents/:encodedPath', async (req: Request, res: Response) => {
  try {
    const zipPath = decodeURIComponent(req.params.encodedPath)
    const contents = await zipService.listZipContents(zipPath)
    
    res.json({
      success: true,
      data: contents,
      message: 'Zip contents retrieved successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to read zip contents',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Create project archive
router.post('/project-archive', async (req: Request, res: Response) => {
  try {
    const { projectPath, outputDir, projectName } = req.body
    
    if (!projectPath || !outputDir) {
      return res.status(400).json({
        success: false,
        error: 'Project path and output directory are required'
      })
    }

    const archivePath = await zipService.createProjectArchive(projectPath, outputDir, projectName)
    const archiveInfo = await zipService.getArchiveInfo(archivePath)
    
    res.json({
      success: true,
      data: {
        archivePath,
        ...archiveInfo
      },
      message: 'Project archive created successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create project archive',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Create deployment package
router.post('/deployment-package', async (req: Request, res: Response) => {
  try {
    const { projectPath, outputDir, buildScript } = req.body
    
    if (!projectPath || !outputDir) {
      return res.status(400).json({
        success: false,
        error: 'Project path and output directory are required'
      })
    }

    const packagePath = await zipService.createDeploymentPackage(projectPath, outputDir, buildScript)
    const packageInfo = await zipService.getArchiveInfo(packagePath)
    
    res.json({
      success: true,
      data: {
        packagePath,
        ...packageInfo
      },
      message: 'Deployment package created successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create deployment package',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Validate zip file
router.get('/validate/:encodedPath', async (req: Request, res: Response) => {
  try {
    const zipPath = decodeURIComponent(req.params.encodedPath)
    const validation = await zipService.validateZip(zipPath)
    
    res.json({
      success: true,
      data: validation,
      message: 'Zip validation completed'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to validate zip file',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get archive info
router.get('/info/:encodedPath', async (req: Request, res: Response) => {
  try {
    const zipPath = decodeURIComponent(req.params.encodedPath)
    const info = await zipService.getArchiveInfo(zipPath)
    
    res.json({
      success: true,
      data: info,
      message: 'Archive information retrieved successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get archive information',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router