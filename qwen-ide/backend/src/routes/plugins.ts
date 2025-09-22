import { Router } from 'express'
import PluginSystem from '../services/pluginSystem.js'

const router = Router()
const pluginSystem = PluginSystem.getInstance()

// Install a plugin
router.post('/install', async (req, res) => {
  try {
    const { source } = req.body

    if (!source) {
      return res.status(400).json({
        success: false,
        error: 'Plugin source is required'
      })
    }

    console.log(`📦 Installing plugin from: ${source}`)

    const pluginInfo = await pluginSystem.installPlugin(source)

    res.json({
      success: true,
      message: 'Plugin installed successfully',
      plugin: pluginInfo
    })

  } catch (error) {
    console.error('❌ Plugin installation failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to install plugin',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Load a plugin
router.post('/load/:pluginId', async (req, res) => {
  try {
    const { pluginId } = req.params

    console.log(`🔄 Loading plugin: ${pluginId}`)

    await pluginSystem.loadPlugin(pluginId)

    res.json({
      success: true,
      message: `Plugin ${pluginId} loaded successfully`
    })

  } catch (error) {
    console.error('❌ Plugin loading failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to load plugin',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Unload a plugin
router.post('/unload/:pluginId', async (req, res) => {
  try {
    const { pluginId } = req.params

    console.log(`🔄 Unloading plugin: ${pluginId}`)

    await pluginSystem.unloadPlugin(pluginId)

    res.json({
      success: true,
      message: `Plugin ${pluginId} unloaded successfully`
    })

  } catch (error) {
    console.error('❌ Plugin unloading failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to unload plugin',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Enable/disable plugin
router.post('/:pluginId/enabled', async (req, res) => {
  try {
    const { pluginId } = req.params
    const { enabled } = req.body

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Enabled status must be a boolean'
      })
    }

    console.log(`${enabled ? '✅' : '❌'} ${enabled ? 'Enabling' : 'Disabling'} plugin: ${pluginId}`)

    await pluginSystem.setPluginEnabled(pluginId, enabled)

    res.json({
      success: true,
      message: `Plugin ${pluginId} ${enabled ? 'enabled' : 'disabled'}`
    })

  } catch (error) {
    console.error('❌ Plugin enable/disable failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to change plugin status',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Uninstall a plugin
router.delete('/:pluginId', async (req, res) => {
  try {
    const { pluginId } = req.params

    console.log(`🗑️ Uninstalling plugin: ${pluginId}`)

    await pluginSystem.uninstallPlugin(pluginId)

    res.json({
      success: true,
      message: `Plugin ${pluginId} uninstalled successfully`
    })

  } catch (error) {
    console.error('❌ Plugin uninstallation failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to uninstall plugin',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get installed plugins
router.get('/', (req, res) => {
  try {
    const plugins = pluginSystem.getInstalledPlugins()

    res.json({
      success: true,
      plugins: plugins.map(plugin => ({
        id: plugin.manifest.id,
        name: plugin.manifest.name,
        version: plugin.manifest.version,
        description: plugin.manifest.description,
        enabled: plugin.enabled,
        loaded: plugin.loaded,
        error: plugin.error
      }))
    })

  } catch (error) {
    console.error('❌ Failed to get plugins:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve plugins'
    })
  }
})

// Get plugin details
router.get('/:pluginId', (req, res) => {
  try {
    const { pluginId } = req.params
    const plugins = pluginSystem.getInstalledPlugins()
    const plugin = plugins.find(p => p.manifest.id === pluginId)

    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      })
    }

    res.json({
      success: true,
      plugin
    })

  } catch (error) {
    console.error('❌ Failed to get plugin details:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve plugin details'
    })
  }
})

// Execute plugin command
router.post('/execute/:pluginId/:command', async (req, res) => {
  try {
    const { pluginId, command } = req.params
    const args = req.body.args || []

    console.log(`⚡ Executing plugin command: ${pluginId}.${command}`)

    const result = await pluginSystem.executeCommand(`${pluginId}.${command}`, ...args)

    res.json({
      success: true,
      result
    })

  } catch (error) {
    console.error('❌ Plugin command execution failed:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to execute plugin command',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router