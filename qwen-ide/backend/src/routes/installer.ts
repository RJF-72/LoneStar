import { Router, Request, Response } from 'express'
import installerWizardService from '../services/installerWizardService.js'
import path from 'path'

const router = Router()

// Generate installer configuration
router.post('/config', async (req: Request, res: Response) => {
  try {
    const { projectPath } = req.body
    
    if (!projectPath) {
      return res.status(400).json({
        success: false,
        error: 'Project path is required'
      })
    }

    const config = await installerWizardService.generateInstallerConfig(projectPath)
    
    res.json({
      success: true,
      data: config,
      message: 'Installer configuration generated successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate installer configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Create Windows installer
router.post('/windows', async (req: Request, res: Response) => {
  try {
    const { projectPath, outputPath, config, options = {} } = req.body
    
    if (!projectPath || !outputPath || !config) {
      return res.status(400).json({
        success: false,
        error: 'Project path, output path, and config are required'
      })
    }

    const installerPath = await installerWizardService.createWindowsInstaller(
      projectPath,
      outputPath,
      config,
      options
    )
    
    res.json({
      success: true,
      data: { installerPath },
      message: 'Windows installer created successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create Windows installer',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Create Linux package
router.post('/linux', async (req: Request, res: Response) => {
  try {
    const { projectPath, outputPath, config, format = 'deb' } = req.body
    
    if (!projectPath || !outputPath || !config) {
      return res.status(400).json({
        success: false,
        error: 'Project path, output path, and config are required'
      })
    }

    const packagePath = await installerWizardService.createLinuxPackage(
      projectPath,
      outputPath,
      config,
      format
    )
    
    res.json({
      success: true,
      data: { packagePath },
      message: `Linux ${format.toUpperCase()} package created successfully`
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create Linux package',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Create macOS installer
router.post('/macos', async (req: Request, res: Response) => {
  try {
    const { projectPath, outputPath, config } = req.body
    
    if (!projectPath || !outputPath || !config) {
      return res.status(400).json({
        success: false,
        error: 'Project path, output path, and config are required'
      })
    }

    const installerPath = await installerWizardService.createMacInstaller(
      projectPath,
      outputPath,
      config
    )
    
    res.json({
      success: true,
      data: { installerPath },
      message: 'macOS installer created successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create macOS installer',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Create portable package
router.post('/portable', async (req: Request, res: Response) => {
  try {
    const { projectPath, outputPath, config } = req.body
    
    if (!projectPath || !outputPath || !config) {
      return res.status(400).json({
        success: false,
        error: 'Project path, output path, and config are required'
      })
    }

    const packagePath = await installerWizardService.createPortablePackage(
      projectPath,
      outputPath,
      config
    )
    
    res.json({
      success: true,
      data: { packagePath },
      message: 'Portable package created successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create portable package',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Validate installer
router.get('/validate/:encodedPath', async (req: Request, res: Response) => {
  try {
    const installerPath = decodeURIComponent(req.params.encodedPath)
    const validation = await installerWizardService.validateInstaller(installerPath)
    
    res.json({
      success: true,
      data: validation,
      message: 'Installer validation completed'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to validate installer',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Create multi-platform installer wizard
router.post('/multi-platform', async (req: Request, res: Response) => {
  try {
    const { projectPath, outputPath, config, platforms = ['windows', 'linux', 'macos'] } = req.body
    
    if (!projectPath || !outputPath || !config) {
      return res.status(400).json({
        success: false,
        error: 'Project path, output path, and config are required'
      })
    }

    const results: Record<string, string> = {}
    
    // Create installers for each platform
    for (const platform of platforms) {
      try {
        let installerPath: string
        
        switch (platform) {
          case 'windows':
            installerPath = await installerWizardService.createWindowsInstaller(
              projectPath,
              path.join(outputPath, 'windows'),
              config
            )
            break
          case 'linux':
            installerPath = await installerWizardService.createLinuxPackage(
              projectPath,
              path.join(outputPath, 'linux'),
              config,
              'deb'
            )
            break
          case 'macos':
            installerPath = await installerWizardService.createMacInstaller(
              projectPath,
              path.join(outputPath, 'macos'),
              config
            )
            break
          default:
            continue
        }
        
        results[platform] = installerPath
      } catch (error) {
        console.error(`Failed to create ${platform} installer:`, error)
        results[platform] = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
    
    // Also create portable package
    try {
      const portablePath = await installerWizardService.createPortablePackage(
        projectPath,
        path.join(outputPath, 'portable'),
        config
      )
      results.portable = portablePath
    } catch (error) {
      console.error('Failed to create portable package:', error)
      results.portable = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
    
    res.json({
      success: true,
      data: { installers: results },
      message: 'Multi-platform installers created'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create multi-platform installers',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router