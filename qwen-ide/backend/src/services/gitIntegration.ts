import { EventEmitter } from 'events'
import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const execAsync = promisify(exec)

export interface GitStatus {
  branch: string
  ahead: number
  behind: number
  staged: string[]
  modified: string[]
  untracked: string[]
  deleted: string[]
  conflicted: string[]
  clean: boolean
}

export interface GitCommit {
  hash: string
  message: string
  author: string
  email: string
  date: Date
  files: string[]
  insertions: number
  deletions: number
}

export interface GitBranch {
  name: string
  current: boolean
  remote?: string
  ahead: number
  behind: number
}

export interface GitStash {
  index: number
  message: string
  date: Date
  hash: string
}

export interface GitConfig {
  user: {
    name: string
    email: string
  }
  core: {
    editor: string
    autocrlf: boolean
  }
  remote: {
    origin?: {
      url: string
      fetch: string
    }
  }
}

export class GitIntegration extends EventEmitter {
  private static instance: GitIntegration
  private workspacePath: string
  private currentStatus: GitStatus | null = null

  private constructor(workspacePath: string = process.cwd()) {
    super()
    this.workspacePath = workspacePath
  }

  static getInstance(workspacePath?: string): GitIntegration {
    if (!GitIntegration.instance) {
      GitIntegration.instance = new GitIntegration(workspacePath)
    }
    return GitIntegration.instance
  }

  /**
   * Initialize a Git repository
   */
  async initRepository(): Promise<void> {
    try {
      console.log('📝 Initializing Git repository...')

      await this.executeGitCommand('init')
      await this.executeGitCommand('config', 'user.name', 'LoneStar AI')
      await this.executeGitCommand('config', 'user.email', 'ai@lonestar.dev')

      // Create initial .gitignore
      const gitignorePath = path.join(this.workspacePath, '.gitignore')
      const gitignoreContent = this.getDefaultGitignore()
      fs.writeFileSync(gitignorePath, gitignoreContent)

      await this.executeGitCommand('add', '.gitignore')
      await this.executeGitCommand('commit', '-m', 'Initial commit - LoneStar AI IDE setup')

      console.log('✅ Git repository initialized')
      this.emit('repository:initialized')

    } catch (error) {
      console.error('❌ Failed to initialize Git repository:', error)
      throw error
    }
  }

  /**
   * Get current repository status
   */
  async getStatus(): Promise<GitStatus> {
    try {
      const [statusOutput, branchOutput] = await Promise.all([
        this.executeGitCommand('status', '--porcelain'),
        this.executeGitCommand('branch', '--show-current')
      ])

      const branch = branchOutput.trim() || 'main'
      const files = statusOutput.trim().split('\n').filter(line => line.trim())

      const staged: string[] = []
      const modified: string[] = []
      const untracked: string[] = []
      const deleted: string[] = []
      const conflicted: string[] = []

      for (const file of files) {
        if (!file) continue

        const status = file.substring(0, 2)
        const filename = file.substring(3)

        if (status[0] !== ' ') staged.push(filename)
        if (status[1] === 'M') modified.push(filename)
        if (status === '??') untracked.push(filename)
        if (status[1] === 'D') deleted.push(filename)
        if (status.includes('U') || status.includes('A') || status.includes('D')) {
          conflicted.push(filename)
        }
      }

      // Get ahead/behind counts
      let ahead = 0
      let behind = 0

      try {
        const aheadBehindOutput = await this.executeGitCommand('rev-list', '--count', '--left-right', `${branch}...origin/${branch}`)
        const [aheadStr, behindStr] = aheadBehindOutput.trim().split('\t')
        ahead = parseInt(aheadStr) || 0
        behind = parseInt(behindStr) || 0
      } catch {
        // No remote tracking branch
      }

      const status: GitStatus = {
        branch,
        ahead,
        behind,
        staged,
        modified,
        untracked,
        deleted,
        conflicted,
        clean: files.length === 0 && ahead === 0 && behind === 0
      }

      this.currentStatus = status
      return status

    } catch (error) {
      console.error('❌ Failed to get Git status:', error)
      throw error
    }
  }

  /**
   * Stage files for commit
   */
  async stageFiles(files: string[] = ['.']): Promise<void> {
    try {
      console.log(`📤 Staging ${files.length} file(s)...`)

      if (files.length === 1 && files[0] === '.') {
        await this.executeGitCommand('add', '.')
      } else {
        for (const file of files) {
          await this.executeGitCommand('add', file)
        }
      }

      console.log('✅ Files staged')
      this.emit('files:staged', files)

    } catch (error) {
      console.error('❌ Failed to stage files:', error)
      throw error
    }
  }

  /**
   * Unstage files
   */
  async unstageFiles(files: string[]): Promise<void> {
    try {
      console.log(`📥 Unstaging ${files.length} file(s)...`)

      for (const file of files) {
        await this.executeGitCommand('reset', 'HEAD', file)
      }

      console.log('✅ Files unstaged')
      this.emit('files:unstaged', files)

    } catch (error) {
      console.error('❌ Failed to unstage files:', error)
      throw error
    }
  }

  /**
   * Create a commit with AI-generated message
   */
  async commit(message?: string, files?: string[]): Promise<GitCommit> {
    try {
      // Stage files if specified
      if (files && files.length > 0) {
        await this.stageFiles(files)
      }

      // Generate AI commit message if not provided
      let commitMessage = message
      if (!commitMessage) {
        commitMessage = await this.generateAICommitMessage()
      }

      console.log(`💾 Creating commit: ${commitMessage}`)

      // Create commit
      await this.executeGitCommand('commit', '-m', commitMessage)

      // Get commit details
      const logOutput = await this.executeGitCommand('log', '-1', '--pretty=format:%H|%s|%an|%ae|%ad', '--date=iso')
      const [hash, msg, author, email, dateStr] = logOutput.trim().split('|')

      const commit: GitCommit = {
        hash,
        message: msg,
        author,
        email,
        date: new Date(dateStr),
        files: [],
        insertions: 0,
        deletions: 0
      }

      // Get file changes
      try {
        const showOutput = await this.executeGitCommand('show', '--stat', '--pretty=format:', hash)
        const lines = showOutput.trim().split('\n')
        const statLine = lines[lines.length - 1]

        if (statLine && statLine.includes('changed')) {
          const match = statLine.match(/(\d+) insertions?\(\+\), (\d+) deletions?\(\-\)/)
          if (match) {
            commit.insertions = parseInt(match[1])
            commit.deletions = parseInt(match[2])
          }
        }

        // Extract file names
        const fileLines = lines.slice(0, -1)
        commit.files = fileLines.map(line => line.split('|')[0].trim())
      } catch {
        // Ignore stat parsing errors
      }

      console.log(`✅ Commit created: ${hash.substring(0, 8)}`)
      this.emit('commit:created', commit)

      return commit

    } catch (error) {
      console.error('❌ Failed to create commit:', error)
      throw error
    }
  }

  /**
   * Push changes to remote
   */
  async push(remote: string = 'origin', branch?: string): Promise<void> {
    try {
      const currentBranch = branch || (await this.getStatus()).branch
      console.log(`⬆️ Pushing to ${remote}/${currentBranch}...`)

      await this.executeGitCommand('push', remote, currentBranch)

      console.log('✅ Changes pushed')
      this.emit('changes:pushed', { remote, branch: currentBranch })

    } catch (error) {
      console.error('❌ Failed to push changes:', error)
      throw error
    }
  }

  /**
   * Pull changes from remote
   */
  async pull(remote: string = 'origin', branch?: string): Promise<void> {
    try {
      const currentBranch = branch || (await this.getStatus()).branch
      console.log(`⬇️ Pulling from ${remote}/${currentBranch}...`)

      await this.executeGitCommand('pull', remote, currentBranch)

      console.log('✅ Changes pulled')
      this.emit('changes:pulled', { remote, branch: currentBranch })

    } catch (error) {
      console.error('❌ Failed to pull changes:', error)
      throw error
    }
  }

  /**
   * Create and switch to a new branch
   */
  async createBranch(name: string, checkout: boolean = true): Promise<void> {
    try {
      console.log(`🌿 Creating branch: ${name}`)

      await this.executeGitCommand('branch', name)

      if (checkout) {
        await this.checkoutBranch(name)
      }

      console.log(`✅ Branch created: ${name}`)
      this.emit('branch:created', { name, checkout })

    } catch (error) {
      console.error('❌ Failed to create branch:', error)
      throw error
    }
  }

  /**
   * Switch to a branch
   */
  async checkoutBranch(name: string): Promise<void> {
    try {
      console.log(`🔄 Switching to branch: ${name}`)

      await this.executeGitCommand('checkout', name)

      console.log(`✅ Switched to branch: ${name}`)
      this.emit('branch:switched', name)

    } catch (error) {
      console.error('❌ Failed to switch branch:', error)
      throw error
    }
  }

  /**
   * Get list of branches
   */
  async getBranches(): Promise<GitBranch[]> {
    try {
      const output = await this.executeGitCommand('branch', '-a', '--format=%(refname:short)|%(upstream:short)|%(ahead)|%(behind)|%(HEAD)')
      const lines = output.trim().split('\n')

      const branches: GitBranch[] = []

      for (const line of lines) {
        const [name, upstream, aheadStr, behindStr, head] = line.split('|')
        const current = head === '*'

        branches.push({
          name,
          current,
          remote: upstream || undefined,
          ahead: parseInt(aheadStr) || 0,
          behind: parseInt(behindStr) || 0
        })
      }

      return branches

    } catch (error) {
      console.error('❌ Failed to get branches:', error)
      throw error
    }
  }

  /**
   * Get commit history
   */
  async getCommitHistory(limit: number = 50): Promise<GitCommit[]> {
    try {
      const output = await this.executeGitCommand('log', `-${limit}`, '--pretty=format:%H|%s|%an|%ae|%ad|%N', '--date=iso', '--name-only')
      const entries = output.trim().split('\n\n')

      const commits: GitCommit[] = []

      for (const entry of entries) {
        const lines = entry.split('\n')
        if (lines.length < 2) continue

        const [hash, message, author, email, dateStr] = lines[0].split('|')
        const files = lines.slice(1).filter(line => line.trim())

        commits.push({
          hash,
          message,
          author,
          email,
          date: new Date(dateStr),
          files,
          insertions: 0, // Would need additional parsing
          deletions: 0
        })
      }

      return commits

    } catch (error) {
      console.error('❌ Failed to get commit history:', error)
      throw error
    }
  }

  /**
   * Stash current changes
   */
  async stash(message?: string): Promise<void> {
    try {
      const stashMessage = message || `WIP: ${new Date().toISOString()}`
      console.log(`📦 Stashing changes: ${stashMessage}`)

      await this.executeGitCommand('stash', 'push', '-m', stashMessage)

      console.log('✅ Changes stashed')
      this.emit('changes:stashed', stashMessage)

    } catch (error) {
      console.error('❌ Failed to stash changes:', error)
      throw error
    }
  }

  /**
   * Apply stashed changes
   */
  async stashPop(index?: number): Promise<void> {
    try {
      const stashRef = index !== undefined ? `stash@{${index}}` : 'stash'
      console.log(`📤 Applying stashed changes: ${stashRef}`)

      await this.executeGitCommand('stash', 'pop', stashRef)

      console.log('✅ Stashed changes applied')
      this.emit('stash:applied', index)

    } catch (error) {
      console.error('❌ Failed to apply stashed changes:', error)
      throw error
    }
  }

  /**
   * Get Git configuration
   */
  async getConfig(): Promise<GitConfig> {
    try {
      const [userName, userEmail, coreEditor, coreAutocrlf, remoteUrl, remoteFetch] = await Promise.all([
        this.executeGitCommand('config', 'user.name').catch(() => 'Unknown'),
        this.executeGitCommand('config', 'user.email').catch(() => 'unknown@example.com'),
        this.executeGitCommand('config', 'core.editor').catch(() => 'nano'),
        this.executeGitCommand('config', 'core.autocrlf').catch(() => 'false'),
        this.executeGitCommand('config', 'remote.origin.url').catch(() => ''),
        this.executeGitCommand('config', 'remote.origin.fetch').catch(() => '')
      ])

      return {
        user: {
          name: userName.trim(),
          email: userEmail.trim()
        },
        core: {
          editor: coreEditor.trim(),
          autocrlf: coreAutocrlf.trim().toLowerCase() === 'true'
        },
        remote: {
          origin: remoteUrl.trim() ? {
            url: remoteUrl.trim(),
            fetch: remoteFetch.trim() || '+refs/heads/*:refs/remotes/origin/*'
          } : undefined
        }
      }

    } catch (error) {
      console.error('❌ Failed to get Git config:', error)
      throw error
    }
  }

  /**
   * Set Git configuration
   */
  async setConfig(config: Partial<GitConfig>): Promise<void> {
    try {
      if (config.user?.name) {
        await this.executeGitCommand('config', 'user.name', config.user.name)
      }
      if (config.user?.email) {
        await this.executeGitCommand('config', 'user.email', config.user.email)
      }
      if (config.core?.editor) {
        await this.executeGitCommand('config', 'core.editor', config.core.editor)
      }
      if (config.core?.autocrlf !== undefined) {
        await this.executeGitCommand('config', 'core.autocrlf', config.core.autocrlf.toString())
      }

      console.log('✅ Git configuration updated')
      this.emit('config:updated', config)

    } catch (error) {
      console.error('❌ Failed to set Git config:', error)
      throw error
    }
  }

  /**
   * Generate AI-powered commit message
   */
  private async generateAICommitMessage(): Promise<string> {
    try {
      const status = await this.getStatus()
      const changedFiles = [...status.staged, ...status.modified]

      if (changedFiles.length === 0) {
        return 'Update project files'
      }

      // Analyze file types and changes
      const fileTypes = changedFiles.map(file => path.extname(file)).filter(ext => ext)
      const uniqueTypes = [...new Set(fileTypes)]

      // Generate contextual message based on file types
      let message = 'Update '

      if (uniqueTypes.length === 1) {
        const type = uniqueTypes[0]
        switch (type) {
          case '.ts':
          case '.js':
            message += 'TypeScript/JavaScript code'
            break
          case '.py':
            message += 'Python code'
            break
          case '.md':
            message += 'documentation'
            break
          case '.json':
            message += 'configuration files'
            break
          default:
            message += `${type} files`
        }
      } else if (uniqueTypes.length > 1) {
        message += 'multiple file types'
      } else {
        message += 'project files'
      }

      // Add action context
      if (status.staged.length > 0 && status.modified.length === 0) {
        message += ' (new files)'
      } else if (status.modified.length > 0) {
        message += ' (modifications)'
      }

      return message

    } catch {
      return `Update ${new Date().toISOString().split('T')[0]}`
    }
  }

  /**
   * Execute Git command with proper error handling
   */
  private async executeGitCommand(...args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const git = spawn('git', args, {
        cwd: this.workspacePath,
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let stdout = ''
      let stderr = ''

      git.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      git.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      git.on('close', (code) => {
        if (code === 0) {
          resolve(stdout)
        } else {
          reject(new Error(`Git command failed: ${stderr || stdout}`))
        }
      })

      git.on('error', (error) => {
        reject(error)
      })
    })
  }

  /**
   * Get default .gitignore content
   */
  private getDefaultGitignore(): string {
    return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Temporary files
tmp/
temp/

# AI Models (large files)
models/*.gguf
models/*.bin
models/*.safetensors

# Plugin data
plugins/*/node_modules/
plugins/*/.env
`
  }

  /**
   * Check if Git is available
   */
  async isGitAvailable(): Promise<boolean> {
    try {
      await this.executeGitCommand('--version')
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if current directory is a Git repository
   */
  async isRepository(): Promise<boolean> {
    try {
      await this.executeGitCommand('rev-parse', '--git-dir')
      return true
    } catch {
      return false
    }
  }
}

export default GitIntegration