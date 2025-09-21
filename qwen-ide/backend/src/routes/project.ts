import { Router, Request, Response } from 'express'
import projectService from '../services/projectService'

const router = Router()

// Get all projects
router.get('/', (req: Request, res: Response) => {
  try {
    const projects = projectService.getProjects()
    res.json({
      success: true,
      data: projects,
      message: 'Projects retrieved successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve projects',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Load project from path
router.post('/load', async (req: Request, res: Response) => {
  try {
    const { path: projectPath } = req.body
    
    if (!projectPath) {
      return res.status(400).json({
        success: false,
        error: 'Project path is required',
        message: 'Please provide a valid project path'
      })
    }

    const project = await projectService.loadProject(projectPath)
    
    return res.json({
      success: true,
      data: project,
      message: `Project "${project.name}" loaded successfully`
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to load project',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Browse directories
router.get('/browse', async (req: Request, res: Response) => {
  try {
    const { path: startPath } = req.query
    const directories = await projectService.getBrowsableDirectories(startPath as string)
    
    res.json({
      success: true,
      data: directories,
      message: 'Directories retrieved successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to browse directories',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Browse directory contents
router.get('/browse/:encodedPath', async (req: Request, res: Response) => {
  try {
    const { encodedPath } = req.params
    const directoryPath = decodeURIComponent(encodedPath)
    
    const contents = await projectService.scanDirectory(directoryPath, 1)
    
    res.json({
      success: true,
      data: contents,
      message: 'Directory contents retrieved successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to browse directory',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get project by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const project = projectService.getProject(req.params.id)
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
        message: `Project with ID "${req.params.id}" does not exist`
      })
    }
    
    return res.json({
      success: true,
      data: project,
      message: 'Project retrieved successfully'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve project',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router