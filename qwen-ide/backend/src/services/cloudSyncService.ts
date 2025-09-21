import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { Project, FileSystemItem } from '../../../shared/types'

interface CloudProject {
  id: string
  name: string
  localPath: string
  cloudId: string
  lastSync: Date
  syncStatus: 'synced' | 'pending' | 'conflict' | 'offline'
  devices: string[]
  owner: string
}

interface SyncState {
  files: { [path: string]: { hash: string; lastModified: Date } }
  projectMeta: {
    name: string
    description: string
    tags: string[]
    language: string
    framework: string
  }
}

export class CloudSyncService {
  private static instance: CloudSyncService
  private cloudProjects: Map<string, CloudProject> = new Map()
  private syncInterval: NodeJS.Timeout | null = null
  private isOnline: boolean = true

  static getInstance(): CloudSyncService {
    if (!CloudSyncService.instance) {
      CloudSyncService.instance = new CloudSyncService()
    }
    return CloudSyncService.instance
  }

  // Initialize cloud sync service
  async initialize() {
    await this.loadSyncedProjects()
    this.startAutoSync()
    this.setupOnlineStatus()
  }

  // Load previously synced projects from local storage
  private async loadSyncedProjects() {
    try {
      const syncFile = path.join(process.cwd(), '.lonestar', 'cloud-sync.json')
      const data = await fs.readFile(syncFile, 'utf-8')
      const projects = JSON.parse(data)
      
      projects.forEach((project: CloudProject) => {
        this.cloudProjects.set(project.id, project)
      })
    } catch (error) {
      // File doesn't exist yet, that's okay
      await this.ensureSyncDirectory()
    }
  }

  // Ensure sync directory exists
  private async ensureSyncDirectory() {
    const syncDir = path.join(process.cwd(), '.lonestar')
    try {
      await fs.access(syncDir)
    } catch {
      await fs.mkdir(syncDir, { recursive: true })
    }
  }

  // Save synced projects to local storage
  private async saveSyncedProjects() {
    await this.ensureSyncDirectory()
    const syncFile = path.join(process.cwd(), '.lonestar', 'cloud-sync.json')
    const projects = Array.from(this.cloudProjects.values())
    await fs.writeFile(syncFile, JSON.stringify(projects, null, 2))
  }

  // Register a project for cloud sync
  async enableCloudSync(project: Project, userEmail: string): Promise<CloudProject> {
    const cloudProject: CloudProject = {
      id: project.id,
      name: project.name,
      localPath: project.path,
      cloudId: this.generateCloudId(),
      lastSync: new Date(),
      syncStatus: 'pending',
      devices: [this.getDeviceId()],
      owner: userEmail
    }

    this.cloudProjects.set(project.id, cloudProject)
    await this.saveSyncedProjects()
    
    // Perform initial sync
    await this.syncProject(project.id)
    
    return cloudProject
  }

  // Sync a specific project
  async syncProject(projectId: string): Promise<void> {
    const cloudProject = this.cloudProjects.get(projectId)
    if (!cloudProject) {
      throw new Error('Project not registered for cloud sync')
    }

    if (!this.isOnline) {
      cloudProject.syncStatus = 'offline'
      return
    }

    try {
      cloudProject.syncStatus = 'pending'
      
      // Get current project state
      const currentState = await this.generateSyncState(cloudProject.localPath)
      
      // Compare with cloud state (simulated for now)
      const cloudState = await this.getCloudState(cloudProject.cloudId)
      
      if (cloudState) {
        // Merge changes
        await this.mergeStates(cloudProject.localPath, currentState, cloudState)
      } else {
        // First sync - upload everything
        await this.uploadProjectState(cloudProject.cloudId, currentState)
      }
      
      cloudProject.lastSync = new Date()
      cloudProject.syncStatus = 'synced'
      
      await this.saveSyncedProjects()
    } catch (error) {
      cloudProject.syncStatus = 'conflict'
      console.error('Sync failed:', error)
      throw error
    }
  }

  // Generate sync state for a project
  private async generateSyncState(projectPath: string): Promise<SyncState> {
    const files: { [path: string]: { hash: string; lastModified: Date } } = {}
    
    const scanFiles = async (dirPath: string, relativePath: string = '') => {
      const items = await fs.readdir(dirPath, { withFileTypes: true })
      
      for (const item of items) {
        // Skip common ignore patterns
        if (this.shouldIgnore(item.name)) continue
        
        const fullPath = path.join(dirPath, item.name)
        const relPath = path.join(relativePath, item.name)
        
        if (item.isDirectory()) {
          await scanFiles(fullPath, relPath)
        } else {
          const content = await fs.readFile(fullPath)
          const hash = crypto.createHash('sha256').update(content).digest('hex')
          const stats = await fs.stat(fullPath)
          
          files[relPath] = {
            hash,
            lastModified: stats.mtime
          }
        }
      }
    }
    
    await scanFiles(projectPath)
    
    // Detect project metadata
    const projectMeta = await this.detectProjectMeta(projectPath)
    
    return { files, projectMeta }
  }

  // Detect project metadata
  private async detectProjectMeta(projectPath: string) {
    let language = 'unknown'
    let framework = 'unknown'
    let name = path.basename(projectPath)
    let description = ''
    let tags: string[] = []

    try {
      // Check for package.json
      const packageJsonPath = path.join(projectPath, 'package.json')
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
        language = 'javascript'
        name = packageJson.name || name
        description = packageJson.description || ''
        
        // Detect framework
        if (packageJson.dependencies?.react || packageJson.devDependencies?.react) {
          framework = 'react'
          tags.push('frontend', 'react')
        } else if (packageJson.dependencies?.express) {
          framework = 'express'
          tags.push('backend', 'api')
        } else if (packageJson.dependencies?.vue) {
          framework = 'vue'
          tags.push('frontend', 'vue')
        }
      } catch {}

      // Check for Python files
      const pythonFiles = await this.countFilesByExtension(projectPath, ['.py'])
      if (pythonFiles > 0) {
        language = 'python'
        tags.push('python')
        
        // Check for common Python frameworks
        try {
          const requirementsPath = path.join(projectPath, 'requirements.txt')
          const requirements = await fs.readFile(requirementsPath, 'utf-8')
          if (requirements.includes('django')) {
            framework = 'django'
            tags.push('web', 'django')
          } else if (requirements.includes('flask')) {
            framework = 'flask'
            tags.push('web', 'flask')
          }
        } catch {}
      }

      // Check for Rust
      try {
        await fs.access(path.join(projectPath, 'Cargo.toml'))
        language = 'rust'
        framework = 'cargo'
        tags.push('rust', 'systems')
      } catch {}

    } catch (error) {
      console.error('Error detecting project meta:', error)
    }

    return { name, description, tags, language, framework }
  }

  // Count files by extension
  private async countFilesByExtension(dirPath: string, extensions: string[]): Promise<number> {
    let count = 0
    
    const scanDir = async (currentPath: string) => {
      try {
        const items = await fs.readdir(currentPath, { withFileTypes: true })
        
        for (const item of items) {
          if (this.shouldIgnore(item.name)) continue
          
          const fullPath = path.join(currentPath, item.name)
          
          if (item.isDirectory()) {
            await scanDir(fullPath)
          } else {
            const ext = path.extname(item.name).toLowerCase()
            if (extensions.includes(ext)) {
              count++
            }
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    }
    
    await scanDir(dirPath)
    return count
  }

  // Get cloud state (simulated - in real implementation this would call a cloud API)
  private async getCloudState(cloudId: string): Promise<SyncState | null> {
    // TODO: Implement actual cloud API call
    // For now, return null to simulate first sync
    return null
  }

  // Upload project state to cloud (simulated)
  private async uploadProjectState(cloudId: string, state: SyncState): Promise<void> {
    // TODO: Implement actual cloud upload
    console.log(`Uploading project ${cloudId} to cloud...`)
    console.log(`Files: ${Object.keys(state.files).length}`)
    console.log(`Project: ${state.projectMeta.name} (${state.projectMeta.language}/${state.projectMeta.framework})`)
  }

  // Merge local and cloud states
  private async mergeStates(localPath: string, localState: SyncState, cloudState: SyncState): Promise<void> {
    // TODO: Implement intelligent merge logic
    // For now, just log the merge attempt
    console.log(`Merging states for project at ${localPath}`)
  }

  // Check if file should be ignored
  private shouldIgnore(fileName: string): boolean {
    const ignorePatterns = [
      'node_modules', '.git', '.DS_Store', 'dist', 'build', 
      '__pycache__', '.pytest_cache', 'target', '.lonestar'
    ]
    return ignorePatterns.includes(fileName) || fileName.startsWith('.')
  }

  // Generate unique cloud ID
  private generateCloudId(): string {
    return crypto.randomBytes(16).toString('hex')
  }

  // Get device ID
  private getDeviceId(): string {
    return require('os').hostname() + '-' + require('os').platform()
  }

  // Setup online status monitoring
  private setupOnlineStatus() {
    // Simple online check - in production this would be more sophisticated
    setInterval(() => {
      this.isOnline = true // TODO: Implement actual connectivity check
    }, 30000)
  }

  // Start auto-sync
  private startAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    
    this.syncInterval = setInterval(async () => {
      for (const [projectId] of this.cloudProjects) {
        try {
          await this.syncProject(projectId)
        } catch (error) {
          console.error(`Auto-sync failed for project ${projectId}:`, error)
        }
      }
    }, 60000) // Sync every minute
  }

  // Get all cloud projects
  getCloudProjects(): CloudProject[] {
    return Array.from(this.cloudProjects.values())
  }

  // Get cloud project status
  getProjectSyncStatus(projectId: string): CloudProject | null {
    return this.cloudProjects.get(projectId) || null
  }

  // Disable cloud sync for a project
  async disableCloudSync(projectId: string): Promise<void> {
    this.cloudProjects.delete(projectId)
    await this.saveSyncedProjects()
  }

  // Cleanup
  dispose() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }
}

export default CloudSyncService.getInstance()