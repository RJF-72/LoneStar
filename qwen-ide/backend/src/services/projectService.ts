import fs from 'fs/promises'
import path from 'path'
import { Project, FileSystemItem } from '../types'

export class ProjectService {
  private static instance: ProjectService
  private projects: Project[] = []

  static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService()
    }
    return ProjectService.instance
  }

  async scanDirectory(dirPath: string, maxDepth: number = 3, currentDepth: number = 0): Promise<FileSystemItem[]> {
    if (currentDepth >= maxDepth) return []

    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true })
      const result: FileSystemItem[] = []

      for (const item of items) {
        // Skip hidden files and common ignore patterns
        if (item.name.startsWith('.') || 
            item.name === 'node_modules' || 
            item.name === 'dist' || 
            item.name === 'build' ||
            item.name === '__pycache__' ||
            item.name === '.git') {
          continue
        }

        const fullPath = path.join(dirPath, item.name)
        const fileItem: FileSystemItem = {
          name: item.name,
          path: fullPath,
          isDirectory: item.isDirectory(),
          size: 0,
          lastModified: new Date(),
        }

        if (item.isDirectory()) {
          // Recursively scan subdirectories
          fileItem.children = await this.scanDirectory(fullPath, maxDepth, currentDepth + 1)
        } else {
          // Get file stats
          const stats = await fs.stat(fullPath)
          fileItem.size = stats.size
          fileItem.lastModified = stats.mtime
        }

        result.push(fileItem)
      }

      // Sort: directories first, then files, both alphabetically
      return result.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
        return a.name.localeCompare(b.name)
      })
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error)
      return []
    }
  }

  async loadProject(projectPath: string): Promise<Project> {
    try {
      const stats = await fs.stat(projectPath)
      if (!stats.isDirectory()) {
        throw new Error('Project path must be a directory')
      }

      const projectName = path.basename(projectPath)
      const files = await this.scanDirectory(projectPath)

      // Detect project type based on files
      const projectType = await this.detectProjectType(projectPath, files)

      const project: Project = {
        id: `project-${Date.now()}`,
        name: projectName,
        path: projectPath,
        type: projectType,
        files: files,
        settings: {
          aiAssistance: true,
          autoComplete: true,
          syntaxHighlighting: true,
          theme: 'dark',
          fontSize: 14,
          tabSize: 2,
          wordWrap: true,
        },
        lastOpened: new Date(),
        createdAt: new Date(),
      }

      // Add to projects list if not already exists
      const existingIndex = this.projects.findIndex(p => p.path === projectPath)
      if (existingIndex >= 0) {
        this.projects[existingIndex] = project
      } else {
        this.projects.push(project)
      }

      return project
    } catch (error) {
      console.error(`Error loading project from ${projectPath}:`, error)
      throw new Error(`Failed to load project: ${error}`)
    }
  }

  private async detectProjectType(projectPath: string, files: FileSystemItem[]): Promise<string> {
    const flatFiles = this.flattenFileTree(files)
    const fileNames = flatFiles.map(f => f.name.toLowerCase())

    // Check for common project markers
    if (fileNames.includes('package.json')) {
      return 'node'
    }
    if (fileNames.includes('requirements.txt') || fileNames.includes('pyproject.toml')) {
      return 'python'
    }
    if (fileNames.includes('cargo.toml')) {
      return 'rust'
    }
    if (fileNames.includes('go.mod')) {
      return 'go'
    }
    if (fileNames.includes('pom.xml') || fileNames.includes('build.gradle')) {
      return 'java'
    }
    if (fileNames.includes('composer.json')) {
      return 'php'
    }

    return 'generic'
  }

  private flattenFileTree(files: FileSystemItem[]): FileSystemItem[] {
    const result: FileSystemItem[] = []
    
    for (const file of files) {
      result.push(file)
      if (file.children) {
        result.push(...this.flattenFileTree(file.children))
      }
    }
    
    return result
  }

  async readFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return content
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error)
      throw new Error(`Failed to read file: ${error}`)
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await fs.writeFile(filePath, content, 'utf-8')
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error)
      throw new Error(`Failed to write file: ${error}`)
    }
  }

  getProjects(): Project[] {
    return this.projects
  }

  getProject(id: string): Project | undefined {
    return this.projects.find(p => p.id === id)
  }

  async getBrowsableDirectories(startPath: string = ''): Promise<FileSystemItem[]> {
    try {
      // If no start path provided, show common starting directories
      if (!startPath) {
        const homedir = require('os').homedir()
        const commonDirs = [
          { path: homedir, name: 'Home (~)' },
          { path: path.join(homedir, 'Documents'), name: 'Documents' },
          { path: path.join(homedir, 'Desktop'), name: 'Desktop' },
          { path: path.join(homedir, 'Downloads'), name: 'Downloads' },
          { path: '/workspaces', name: 'Workspaces' },
          { path: '/', name: 'Root (/)' }
        ]

        const result: FileSystemItem[] = []
        
        for (const dir of commonDirs) {
          try {
            await fs.access(dir.path)
            const stats = await fs.stat(dir.path)
            if (stats.isDirectory()) {
              result.push({
                name: dir.name,
                path: dir.path,
                isDirectory: true,
                size: 0,
                lastModified: stats.mtime,
                children: []
              })
            }
          } catch {
            // Skip inaccessible directories
          }
        }

        return result
      }

      // Browse the specified directory
      return await this.scanDirectory(startPath, 1)
    } catch (error) {
      console.error('Error getting browsable directories:', error)
      return []
    }
  }
}

export default ProjectService.getInstance()