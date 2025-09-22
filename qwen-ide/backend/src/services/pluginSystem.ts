import { EventEmitter } from 'events'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  license?: string
  main: string
  engines: {
    node: string
    lonestar: string
  }
  keywords?: string[]
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  activationEvents?: string[]
  contributes?: {
    commands?: CommandContribution[]
    menus?: MenuContribution[]
    views?: ViewContribution[]
    keybindings?: KeybindingContribution[]
    configuration?: ConfigurationContribution[]
    languages?: LanguageContribution[]
    themes?: ThemeContribution[]
  }
}

export interface CommandContribution {
  command: string
  title: string
  category?: string
  icon?: string
}

export interface MenuContribution {
  id: string
  command: string
  when?: string
  group?: string
}

export interface ViewContribution {
  id: string
  name: string
  type: 'tree' | 'webview'
  icon?: string
  contextValue?: string
}

export interface KeybindingContribution {
  command: string
  key: string
  when?: string
  mac?: string
  linux?: string
  win?: string
}

export interface ConfigurationContribution {
  title: string
  properties: Record<string, ConfigurationProperty>
}

export interface ConfigurationProperty {
  type: string
  default?: any
  description?: string
  enum?: string[]
  enumDescriptions?: string[]
}

export interface LanguageContribution {
  id: string
  aliases: string[]
  extensions: string[]
  configuration?: string
}

export interface ThemeContribution {
  label: string
  uiTheme: 'vs' | 'vs-dark' | 'hc-black'
  path: string
}

export interface PluginContext {
  subscriptions: { dispose(): void }[]
  workspaceState: Map<string, any>
  globalState: Map<string, any>
  extensionPath: string
  extensionUri: string
  log: (message: string, level?: 'info' | 'warn' | 'error') => void
}

export interface PluginAPI {
  commands: {
    registerCommand(command: string, handler: (...args: any[]) => any): { dispose(): void }
    executeCommand<T = any>(command: string, ...args: any[]): Promise<T>
  }
  workspace: {
    getConfiguration(section?: string): any
    onDidChangeConfiguration: EventEmitter
  }
  window: {
    showInformationMessage(message: string, ...items: string[]): Promise<string | undefined>
    showWarningMessage(message: string, ...items: string[]): Promise<string | undefined>
    showErrorMessage(message: string, ...items: string[]): Promise<string | undefined>
    createWebviewPanel(viewType: string, title: string, showOptions: any): any
  }
  languages: {
    registerCompletionItemProvider(selector: string, provider: any): { dispose(): void }
    registerHoverProvider(selector: string, provider: any): { dispose(): void }
  }
}

export abstract class LoneStarPlugin {
  protected context!: PluginContext
  protected api!: PluginAPI

  abstract activate(context: PluginContext, api: PluginAPI): void | Promise<void>
  deactivate?(): void | Promise<void>
}

export interface PluginInfo {
  manifest: PluginManifest
  path: string
  enabled: boolean
  loaded: boolean
  error?: string
}

export class PluginSystem extends EventEmitter {
  private static instance: PluginSystem
  private plugins: Map<string, PluginInfo> = new Map()
  private loadedPlugins: Map<string, LoneStarPlugin> = new Map()
  private pluginDirectory: string
  private api!: PluginAPI

  private constructor() {
    super()
    this.pluginDirectory = path.join(process.cwd(), 'plugins')
    this.ensurePluginDirectory()
    this.initializeAPI()
    this.loadPluginIndex()
  }

  static getInstance(): PluginSystem {
    if (!PluginSystem.instance) {
      PluginSystem.instance = new PluginSystem()
    }
    return PluginSystem.instance
  }

  private ensurePluginDirectory(): void {
    if (!fs.existsSync(this.pluginDirectory)) {
      fs.mkdirSync(this.pluginDirectory, { recursive: true })
    }
  }

  private initializeAPI(): void {
    this.api = {
      commands: {
        registerCommand: (command: string, handler: (...args: any[]) => any) => {
          // Command registration implementation
          return {
            dispose: () => {
              // Cleanup implementation
            }
          }
        },
        executeCommand: async <T = any>(command: string, ...args: any[]): Promise<T> => {
          // Command execution implementation
          return null as T
        }
      },
      workspace: {
        getConfiguration: (section?: string) => {
          // Configuration retrieval implementation
          return {}
        },
        onDidChangeConfiguration: new EventEmitter()
      },
      window: {
        showInformationMessage: async (message: string, ...items: string[]) => {
          console.log(`ℹ️ ${message}`)
          return items[0]
        },
        showWarningMessage: async (message: string, ...items: string[]) => {
          console.warn(`⚠️ ${message}`)
          return items[0]
        },
        showErrorMessage: async (message: string, ...items: string[]) => {
          console.error(`❌ ${message}`)
          return items[0]
        },
        createWebviewPanel: (viewType: string, title: string, showOptions: any) => {
          // Webview panel creation implementation
          return {}
        }
      },
      languages: {
        registerCompletionItemProvider: (selector: string, provider: any) => {
          return { dispose: () => {} }
        },
        registerHoverProvider: (selector: string, provider: any) => {
          return { dispose: () => {} }
        }
      }
    }
  }

  /**
   * Install a plugin from a package file or URL
   */
  async installPlugin(source: string): Promise<PluginInfo> {
    console.log(`📦 Installing plugin from: ${source}`)

    try {
      let pluginPath: string

      if (source.startsWith('http://') || source.startsWith('https://')) {
        // Download from URL
        pluginPath = await this.downloadPlugin(source)
      } else if (source.endsWith('.tgz') || source.endsWith('.tar.gz')) {
        // Install from local tarball
        pluginPath = await this.extractPlugin(source)
      } else {
        throw new Error('Unsupported plugin source format')
      }

      // Load and validate manifest
      const manifest = await this.loadPluginManifest(pluginPath)
      const pluginId = manifest.id

      if (this.plugins.has(pluginId)) {
        throw new Error(`Plugin ${pluginId} is already installed`)
      }

      // Install dependencies if specified
      if (manifest.dependencies) {
        await this.installDependencies(manifest.dependencies, pluginPath)
      }

      const pluginInfo: PluginInfo = {
        manifest,
        path: pluginPath,
        enabled: true,
        loaded: false
      }

      this.plugins.set(pluginId, pluginInfo)
      this.savePluginIndex()

      console.log(`✅ Plugin installed: ${manifest.name} (${pluginId})`)
      this.emit('plugin:installed', pluginInfo)

      return pluginInfo

    } catch (error) {
      console.error('❌ Failed to install plugin:', error)
      throw error
    }
  }

  /**
   * Load and activate a plugin
   */
  async loadPlugin(pluginId: string): Promise<void> {
    const pluginInfo = this.plugins.get(pluginId)
    if (!pluginInfo) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    if (!pluginInfo.enabled) {
      throw new Error(`Plugin ${pluginId} is disabled`)
    }

    if (pluginInfo.loaded) {
      return // Already loaded
    }

    try {
      console.log(`🔄 Loading plugin: ${pluginInfo.manifest.name}`)

      // Load the main module
      const mainPath = path.join(pluginInfo.path, pluginInfo.manifest.main)
      const PluginClass = await this.loadPluginModule(mainPath)

      // Create plugin instance
      const plugin = new (PluginClass as new () => LoneStarPlugin)()

      // Create context
      const context: PluginContext = {
        subscriptions: [],
        workspaceState: new Map(),
        globalState: new Map(),
        extensionPath: pluginInfo.path,
        extensionUri: `file://${pluginInfo.path}`,
        log: (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
          const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️'
          console.log(`${prefix} [${pluginInfo.manifest.name}] ${message}`)
        }
      }

      // Activate plugin
      await plugin.activate(context, this.api)

      this.loadedPlugins.set(pluginId, plugin)
      pluginInfo.loaded = true

      console.log(`✅ Plugin loaded: ${pluginInfo.manifest.name}`)
      this.emit('plugin:loaded', pluginInfo)

    } catch (error) {
      console.error(`❌ Failed to load plugin ${pluginId}:`, error)
      pluginInfo.error = error instanceof Error ? error.message : 'Unknown error'
      this.emit('plugin:error', { pluginId, error: pluginInfo.error })
      throw error
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.loadedPlugins.get(pluginId)
    const pluginInfo = this.plugins.get(pluginId)

    if (!plugin || !pluginInfo) {
      return
    }

    try {
      console.log(`🔄 Unloading plugin: ${pluginInfo.manifest.name}`)

      // Deactivate plugin
      if (plugin.deactivate) {
        await plugin.deactivate()
      }

      this.loadedPlugins.delete(pluginId)
      pluginInfo.loaded = false

      console.log(`✅ Plugin unloaded: ${pluginInfo.manifest.name}`)
      this.emit('plugin:unloaded', pluginInfo)

    } catch (error) {
      console.error(`❌ Failed to unload plugin ${pluginId}:`, error)
      throw error
    }
  }

  /**
   * Enable or disable a plugin
   */
  async setPluginEnabled(pluginId: string, enabled: boolean): Promise<void> {
    const pluginInfo = this.plugins.get(pluginId)
    if (!pluginInfo) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    if (pluginInfo.enabled === enabled) {
      return
    }

    if (enabled) {
      // Enable plugin
      pluginInfo.enabled = true
      await this.loadPlugin(pluginId)
    } else {
      // Disable plugin
      await this.unloadPlugin(pluginId)
      pluginInfo.enabled = false
    }

    this.savePluginIndex()
    this.emit('plugin:enabled-changed', { pluginId, enabled })
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string): Promise<void> {
    const pluginInfo = this.plugins.get(pluginId)
    if (!pluginInfo) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    // Unload if loaded
    if (pluginInfo.loaded) {
      await this.unloadPlugin(pluginId)
    }

    // Remove files
    try {
      fs.rmSync(pluginInfo.path, { recursive: true, force: true })
    } catch (error) {
      console.warn(`Failed to remove plugin files: ${error}`)
    }

    this.plugins.delete(pluginId)
    this.savePluginIndex()

    console.log(`🗑️ Plugin uninstalled: ${pluginInfo.manifest.name}`)
    this.emit('plugin:uninstalled', pluginId)
  }

  /**
   * Get list of installed plugins
   */
  getInstalledPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Get loaded plugin instance
   */
  getLoadedPlugin(pluginId: string): LoneStarPlugin | undefined {
    return this.loadedPlugins.get(pluginId)
  }

  /**
   * Execute a command from a plugin
   */
  async executeCommand(command: string, ...args: any[]): Promise<any> {
    return this.api.commands.executeCommand(command, ...args)
  }

  private async downloadPlugin(url: string): Promise<string> {
    // Implementation for downloading plugin from URL
    // This would use https.get and tar extraction
    throw new Error('Plugin download from URL not yet implemented')
  }

  private async extractPlugin(tarballPath: string): Promise<string> {
    // Implementation for extracting plugin from tarball
    // This would use tar and fs operations
    throw new Error('Plugin extraction from tarball not yet implemented')
  }

  private async loadPluginManifest(pluginPath: string): Promise<PluginManifest> {
    const manifestPath = path.join(pluginPath, 'package.json')

    if (!fs.existsSync(manifestPath)) {
      throw new Error('Plugin manifest (package.json) not found')
    }

    const manifestData = fs.readFileSync(manifestPath, 'utf8')
    const manifest = JSON.parse(manifestData)

    // Validate required fields
    if (!manifest.id || !manifest.name || !manifest.version || !manifest.main) {
      throw new Error('Invalid plugin manifest: missing required fields')
    }

    return manifest as PluginManifest
  }

  private async loadPluginModule(mainPath: string): Promise<typeof LoneStarPlugin> {
    // Dynamic import of plugin module
    const module = await import(mainPath)
    return module.default || module
  }

  private async installDependencies(dependencies: Record<string, string>, pluginPath: string): Promise<void> {
    // Install npm dependencies for the plugin
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    const deps = Object.entries(dependencies).map(([name, version]) => `${name}@${version}`).join(' ')

    try {
      await execAsync(`npm install ${deps}`, { cwd: pluginPath })
    } catch (error) {
      console.warn(`Failed to install plugin dependencies: ${error}`)
    }
  }

  private loadPluginIndex(): void {
    try {
      const indexPath = path.join(this.pluginDirectory, 'plugins.json')
      if (fs.existsSync(indexPath)) {
        const data = fs.readFileSync(indexPath, 'utf8')
        const index = JSON.parse(data)

        this.plugins.clear()
        for (const [id, info] of Object.entries(index)) {
          this.plugins.set(id, info as PluginInfo)
        }
      }
    } catch (error) {
      console.warn('Failed to load plugin index:', error)
    }
  }

  private savePluginIndex(): void {
    try {
      const indexPath = path.join(this.pluginDirectory, 'plugins.json')
      const index = Object.fromEntries(this.plugins)
      fs.writeFileSync(indexPath, JSON.stringify(index, null, 2))
    } catch (error) {
      console.error('Failed to save plugin index:', error)
    }
  }
}

export default PluginSystem