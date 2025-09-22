import { Router } from 'express'
import GitIntegration from '../services/gitIntegration.js'

const router = Router()
const git = GitIntegration.getInstance()

// Initialize Git repository
router.post('/init', async (req, res) => {
  try {
    console.log('📝 Initializing Git repository...')

    await git.initRepository()

    res.json({
      success: true,
      message: 'Git repository initialized successfully'
    })

  } catch (error) {
    console.error('❌ Git initialization failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to initialize Git repository',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get repository status
router.get('/status', async (req, res) => {
  try {
    const status = await git.getStatus()

    res.json({
      success: true,
      status
    })

  } catch (error) {
    console.error('❌ Failed to get Git status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get repository status'
    })
  }
})

// Stage files
router.post('/stage', async (req, res) => {
  try {
    const { files } = req.body

    if (!Array.isArray(files)) {
      return res.status(400).json({
        success: false,
        error: 'Files must be an array'
      })
    }

    console.log(`📤 Staging ${files.length} file(s)...`)

    await git.stageFiles(files)

    res.json({
      success: true,
      message: `${files.length} file(s) staged successfully`
    })

  } catch (error) {
    console.error('❌ File staging failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to stage files',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Unstage files
router.post('/unstage', async (req, res) => {
  try {
    const { files } = req.body

    if (!Array.isArray(files)) {
      return res.status(400).json({
        success: false,
        error: 'Files must be an array'
      })
    }

    console.log(`📥 Unstaging ${files.length} file(s)...`)

    await git.unstageFiles(files)

    res.json({
      success: true,
      message: `${files.length} file(s) unstaged successfully`
    })

  } catch (error) {
    console.error('❌ File unstaging failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to unstage files',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Create commit
router.post('/commit', async (req, res) => {
  try {
    const { message, files } = req.body

    console.log(`💾 Creating commit: ${message || 'Auto-generated message'}`)

    const commit = await git.commit(message, files)

    res.json({
      success: true,
      message: 'Commit created successfully',
      commit
    })

  } catch (error) {
    console.error('❌ Commit creation failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create commit',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Push changes
router.post('/push', async (req, res) => {
  try {
    const { remote = 'origin', branch } = req.body

    console.log(`⬆️ Pushing to ${remote}/${branch || 'current branch'}...`)

    await git.push(remote, branch)

    res.json({
      success: true,
      message: 'Changes pushed successfully'
    })

  } catch (error) {
    console.error('❌ Push failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to push changes',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Pull changes
router.post('/pull', async (req, res) => {
  try {
    const { remote = 'origin', branch } = req.body

    console.log(`⬇️ Pulling from ${remote}/${branch || 'current branch'}...`)

    await git.pull(remote, branch)

    res.json({
      success: true,
      message: 'Changes pulled successfully'
    })

  } catch (error) {
    console.error('❌ Pull failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to pull changes',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Create branch
router.post('/branches', async (req, res) => {
  try {
    const { name, checkout = true } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Branch name is required'
      })
    }

    console.log(`🌿 Creating branch: ${name}`)

    await git.createBranch(name, checkout)

    res.json({
      success: true,
      message: `Branch '${name}' created${checkout ? ' and checked out' : ''}`
    })

  } catch (error) {
    console.error('❌ Branch creation failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create branch',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Switch branch
router.post('/checkout/:branch', async (req, res) => {
  try {
    const { branch } = req.params

    console.log(`🔄 Switching to branch: ${branch}`)

    await git.checkoutBranch(branch)

    res.json({
      success: true,
      message: `Switched to branch '${branch}'`
    })

  } catch (error) {
    console.error('❌ Branch switch failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to switch branch',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get branches
router.get('/branches', async (req, res) => {
  try {
    const branches = await git.getBranches()

    res.json({
      success: true,
      branches
    })

  } catch (error) {
    console.error('❌ Failed to get branches:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve branches'
    })
  }
})

// Get commit history
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50
    const history = await git.getCommitHistory(limit)

    res.json({
      success: true,
      history
    })

  } catch (error) {
    console.error('❌ Failed to get commit history:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve commit history'
    })
  }
})

// Stash changes
router.post('/stash', async (req, res) => {
  try {
    const { message } = req.body

    console.log(`📦 Stashing changes: ${message || 'WIP'}`)

    await git.stash(message)

    res.json({
      success: true,
      message: 'Changes stashed successfully'
    })

  } catch (error) {
    console.error('❌ Stash failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to stash changes',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Apply stashed changes
router.post('/stash/pop', async (req, res) => {
  try {
    const { index } = req.body

    console.log(`📤 Applying stashed changes: ${index !== undefined ? `stash@{${index}}` : 'stash'}`)

    await git.stashPop(index)

    res.json({
      success: true,
      message: 'Stashed changes applied successfully'
    })

  } catch (error) {
    console.error('❌ Stash pop failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to apply stashed changes',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get Git configuration
router.get('/config', async (req, res) => {
  try {
    const config = await git.getConfig()

    res.json({
      success: true,
      config
    })

  } catch (error) {
    console.error('❌ Failed to get Git config:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve Git configuration'
    })
  }
})

// Update Git configuration
router.post('/config', async (req, res) => {
  try {
    const config = req.body

    await git.setConfig(config)

    res.json({
      success: true,
      message: 'Git configuration updated successfully'
    })

  } catch (error) {
    console.error('❌ Git config update failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update Git configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Check if Git is available
router.get('/available', async (req, res) => {
  try {
    const available = await git.isGitAvailable()

    res.json({
      success: true,
      available
    })

  } catch (error) {
    res.json({
      success: true,
      available: false
    })
  }
})

// Check if current directory is a repository
router.get('/repository', async (req, res) => {
  try {
    const isRepo = await git.isRepository()

    res.json({
      success: true,
      isRepository: isRepo
    })

  } catch (error) {
    res.json({
      success: true,
      isRepository: false
    })
  }
})

export default router