import { Router, Request, Response } from 'express'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// Get workspace root (in production, this should be configurable)
const getWorkspaceRoot = () => {
  return process.env.WORKSPACE_PATH || path.join(process.cwd(), 'workspace')
}

// Ensure workspace directory exists
const ensureWorkspaceDir = async () => {
  const workspaceRoot = getWorkspaceRoot()
  try {
    await fs.access(workspaceRoot)
  } catch {
    await fs.mkdir(workspaceRoot, { recursive: true })
  }
  return workspaceRoot
}

// Security: Prevent path traversal
const sanitizePath = (filePath: string) => {
  // Remove leading slash and resolve path
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath
  const resolvedPath = path.resolve(getWorkspaceRoot(), cleanPath)
  
  // Ensure the resolved path is within workspace
  if (!resolvedPath.startsWith(getWorkspaceRoot())) {
    throw new Error('Access denied: Path outside workspace')
  }
  
  return resolvedPath
}

// List directory contents or get file info
router.get('/info/*', async (req: Request, res: Response) => {
  try {
    await ensureWorkspaceDir()
    const filePath = req.params[0] || ''
    const absolutePath = sanitizePath(filePath)
    
    const stats = await fs.stat(absolutePath)
    
    if (stats.isDirectory()) {
      // List directory contents
      const items = await fs.readdir(absolutePath, { withFileTypes: true })
      const fileList = await Promise.all(
        items.map(async (item) => {
          const itemPath = path.join(absolutePath, item.name)
          const itemStats = await fs.stat(itemPath)
          
          return {
            name: item.name,
            path: path.relative(getWorkspaceRoot(), itemPath),
            isDirectory: item.isDirectory(),
            size: item.isDirectory() ? 0 : itemStats.size,
            lastModified: itemStats.mtime,
          }
        })
      )
      
      res.json({
        success: true,
        data: {
          type: 'directory',
          path: filePath,
          files: fileList
        }
      })
    } else {
      // Get file info
      res.json({
        success: true,
        data: {
          type: 'file',
          path: filePath,
          size: stats.size,
          lastModified: stats.mtime,
        }
      })
    }
  } catch (error) {
    console.error('Error getting file info:', error)
    res.status(404).json({
      success: false,
      error: 'File not found',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Read file content
router.get('/*', async (req: Request, res: Response) => {
  try {
    await ensureWorkspaceDir()
    const filePath = req.params[0]
    
    if (!filePath) {
      // List workspace root
      return res.redirect('/api/files/info/')
    }
    
    const absolutePath = sanitizePath(filePath)
    const content = await fs.readFile(absolutePath, 'utf-8')
    
    res.json({
      success: true,
      data: {
        path: filePath,
        content,
        size: Buffer.byteLength(content, 'utf-8')
      }
    })
  } catch (error) {
    console.error('Error reading file:', error)
    res.status(404).json({
      success: false,
      error: 'File not found or cannot be read',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Create or update file
router.put('/*', async (req: Request, res: Response) => {
  try {
    await ensureWorkspaceDir()
    const filePath = req.params[0]
    const { content, createDirectories = true } = req.body
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'File path required'
      })
    }
    
    const absolutePath = sanitizePath(filePath)
    
    // Create parent directories if needed
    if (createDirectories) {
      const parentDir = path.dirname(absolutePath)
      await fs.mkdir(parentDir, { recursive: true })
    }
    
    await fs.writeFile(absolutePath, content || '', 'utf-8')
    
    const stats = await fs.stat(absolutePath)
    
    res.json({
      success: true,
      data: {
        path: filePath,
        size: stats.size,
        lastModified: stats.mtime
      },
      message: 'File saved successfully'
    })
  } catch (error) {
    console.error('Error writing file:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to write file',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Create directory
router.post('/mkdir/*', async (req: Request, res: Response) => {
  try {
    await ensureWorkspaceDir()
    const dirPath = req.params[0]
    
    if (!dirPath) {
      return res.status(400).json({
        success: false,
        error: 'Directory path required'
      })
    }
    
    const absolutePath = sanitizePath(dirPath)
    await fs.mkdir(absolutePath, { recursive: true })
    
    res.json({
      success: true,
      data: { path: dirPath },
      message: 'Directory created successfully'
    })
  } catch (error) {
    console.error('Error creating directory:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create directory',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Delete file or directory
router.delete('/*', async (req: Request, res: Response) => {
  try {
    const filePath = req.params[0]
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'File path required'
      })
    }
    
    const absolutePath = sanitizePath(filePath)
    const stats = await fs.stat(absolutePath)
    
    if (stats.isDirectory()) {
      await fs.rmdir(absolutePath, { recursive: true })
    } else {
      await fs.unlink(absolutePath)
    }
    
    res.json({
      success: true,
      message: `${stats.isDirectory() ? 'Directory' : 'File'} deleted successfully`
    })
  } catch (error) {
    console.error('Error deleting file:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete file',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Move/rename file or directory
router.patch('/move/*', async (req: Request, res: Response) => {
  try {
    const sourcePath = req.params[0]
    const { newPath } = req.body
    
    if (!sourcePath || !newPath) {
      return res.status(400).json({
        success: false,
        error: 'Source path and new path required'
      })
    }
    
    const sourceAbsolutePath = sanitizePath(sourcePath)
    const newAbsolutePath = sanitizePath(newPath)
    
    // Create parent directory for destination if needed
    const parentDir = path.dirname(newAbsolutePath)
    await fs.mkdir(parentDir, { recursive: true })
    
    await fs.rename(sourceAbsolutePath, newAbsolutePath)
    
    res.json({
      success: true,
      data: {
        oldPath: sourcePath,
        newPath: newPath
      },
      message: 'File moved successfully'
    })
  } catch (error) {
    console.error('Error moving file:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to move file',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router