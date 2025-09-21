import { Router, Request, Response } from 'express'
import cloudSyncService from '../services/cloudSyncService'
import projectService from '../services/projectService'

const router = Router()

// Enable cloud sync for a project
router.post('/enable/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params
    const { userEmail } = req.body
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: 'User email is required for cloud sync'
      })
    }
    
    const project = projectService.getProject(projectId)
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      })
    }
    
    const cloudProject = await cloudSyncService.enableCloudSync(project, userEmail)
    
    return res.json({
      success: true,
      data: cloudProject,
      message: 'Cloud sync enabled successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to enable cloud sync',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get cloud sync status for all projects
router.get('/status', (req: Request, res: Response) => {
  try {
    const cloudProjects = cloudSyncService.getCloudProjects()
    
    return res.json({
      success: true,
      data: cloudProjects,
      message: 'Cloud sync status retrieved successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get sync status',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get cloud sync status for a specific project
router.get('/status/:projectId', (req: Request, res: Response) => {
  try {
    const { projectId } = req.params
    const syncStatus = cloudSyncService.getProjectSyncStatus(projectId)
    
    if (!syncStatus) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or not synced'
      })
    }
    
    return res.json({
      success: true,
      data: syncStatus,
      message: 'Project sync status retrieved successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get project sync status',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Manually trigger sync for a project
router.post('/sync/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params
    
    await cloudSyncService.syncProject(projectId)
    const syncStatus = cloudSyncService.getProjectSyncStatus(projectId)
    
    return res.json({
      success: true,
      data: syncStatus,
      message: 'Project synced successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to sync project',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Disable cloud sync for a project
router.delete('/disable/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params
    
    await cloudSyncService.disableCloudSync(projectId)
    
    return res.json({
      success: true,
      message: 'Cloud sync disabled successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to disable cloud sync',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get available cloud projects (projects synced from other devices)
router.get('/available', async (req: Request, res: Response) => {
  try {
    // TODO: Implement cloud API call to get projects available for this user
    const availableProjects = [
      {
        cloudId: 'demo-project-1',
        name: 'My Web App',
        language: 'javascript',
        framework: 'react',
        lastSync: new Date('2024-01-01'),
        devices: ['laptop-windows', 'desktop-mac'],
        size: '15.2 MB'
      },
      {
        cloudId: 'demo-project-2', 
        name: 'Python API Server',
        language: 'python',
        framework: 'fastapi',
        lastSync: new Date('2024-01-02'),
        devices: ['laptop-windows'],
        size: '8.7 MB'
      }
    ]
    
    return res.json({
      success: true,
      data: availableProjects,
      message: 'Available cloud projects retrieved successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get available projects',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Download a cloud project to local machine
router.post('/download/:cloudId', async (req: Request, res: Response) => {
  try {
    const { cloudId } = req.params
    const { localPath } = req.body
    
    if (!localPath) {
      return res.status(400).json({
        success: false,
        error: 'Local path is required'
      })
    }
    
    // TODO: Implement actual cloud download
    // For now, simulate the download
    console.log(`Downloading project ${cloudId} to ${localPath}`)
    
    // Load the downloaded project
    const project = await projectService.loadProject(localPath)
    
    return res.json({
      success: true,
      data: project,
      message: 'Project downloaded successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to download project',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router