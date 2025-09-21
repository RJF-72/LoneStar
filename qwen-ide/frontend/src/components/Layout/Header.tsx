import { useState } from 'react'
import { 
  File, 
  MessageSquare, 
  Terminal, 
  Settings,
  Brain,
  Package,
  FolderOpen,
  Sun,
  Moon,
  Monitor
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import ProjectBrowser from '../Project/ProjectBrowser'
import type { Project } from '../../../../shared/types'

const Header = () => {
  const { 
    theme, 
    setTheme, 
    activePanel, 
    setActivePanel, 
    currentProject,
    setCurrentProject,
    modelStatus,
    isModelLoading
  } = useAppStore()

  const [showProjectBrowser, setShowProjectBrowser] = useState(false)

  const handleProjectLoad = (project: Project) => {
    setCurrentProject(project)
  }

  const getStatusColor = () => {
    switch (modelStatus) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (modelStatus) {
      case 'connected': return 'Qwen3:4B Ready'
      case 'connecting': return 'Connecting...'
      case 'error': return 'Connection Error'
      default: return 'Disconnected'
    }
  }

  const toggleTheme = () => {
    const themes = ['light', 'dark', 'auto'] as const
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
  }

  const ThemeIcon = () => {
    switch (theme) {
      case 'light': return <Sun size={16} />
      case 'dark': return <Moon size={16} />
      default: return <Monitor size={16} />
    }
  }

  return (
    <>
    <header className="h-12 bg-black border-b-2 border-red-500 flex items-center justify-between px-4">
      {/* Left Side - Logo and Project */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-purple-500 border-2 border-yellow-400 rounded-lg flex items-center justify-center">
            <span className="text-yellow-400 font-bold text-sm">★</span>
          </div>
          <h1 className="text-lg font-semibold text-yellow-400">LoneStar DI IDE</h1>
          <span className="text-xs text-yellow-400 bg-black border border-red-500 px-2 py-1 rounded">Distributed Intelligence</span>
        </div>
        
        {currentProject ? (
          <div className="flex items-center space-x-2 text-yellow-400">
            <button
              onClick={() => setShowProjectBrowser(true)}
              className="flex items-center space-x-2 hover:text-orange-400 transition-colors"
              title="Switch Project"
            >
              <FolderOpen size={16} />
              <span className="text-sm">{currentProject.name}</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowProjectBrowser(true)}
            className="flex items-center space-x-2 text-gray-400 hover:text-yellow-400 border border-red-500 px-3 py-1 rounded transition-colors"
          >
            <FolderOpen size={16} />
            <span className="text-sm">Open Project</span>
          </button>
        )}
      </div>

      {/* Center - Simplified Panel Navigation */}
      <div className="flex items-center space-x-1 bg-black border-2 border-red-500 rounded-lg p-1">
        <button
          onClick={() => setActivePanel(activePanel === 'files' ? 'chat' : 'files')}
          className={`px-4 py-2 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors border-2 ${
            activePanel === 'files' || activePanel === 'chat'
              ? 'bg-blue-600 border-blue-400 text-yellow-400'
              : 'text-yellow-400 hover:text-orange-400 hover:bg-gray-900 border-transparent'
          }`}
          title="Toggle between Files and AI Chat"
        >
          {activePanel === 'files' ? <MessageSquare size={16} /> : <File size={16} />}
          <span>{activePanel === 'files' ? 'AI Chat' : 'Files'}</span>
        </button>
        
        <button
          onClick={() => {
            if (activePanel === 'terminal') {
              setActivePanel('ai')
            } else if (activePanel === 'ai') {
              setActivePanel('codedi')
            } else {
              setActivePanel('terminal')
            }
          }}
          className={`px-4 py-2 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors border-2 ${
            activePanel === 'terminal' || activePanel === 'ai' || activePanel === 'codedi'
              ? 'bg-purple-600 border-purple-400 text-yellow-400'
              : 'text-yellow-400 hover:text-purple-400 hover:bg-gray-900 border-transparent'
          }`}
          title="Cycle through Terminal, AI System, and CodeDI"
        >
          {activePanel === 'terminal' ? <Brain size={16} /> : 
           activePanel === 'ai' ? <Package size={16} /> : <Terminal size={16} />}
          <span>
            {activePanel === 'terminal' ? 'AI System' : 
             activePanel === 'ai' ? 'CodeDI' : 'Terminal'}
          </span>
        </button>

        <button
          onClick={() => setActivePanel('settings')}
          className={`px-4 py-2 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors border-2 ${
            activePanel === 'settings'
              ? 'bg-gray-600 border-gray-400 text-yellow-400'
              : 'text-yellow-400 hover:text-gray-400 hover:bg-gray-900 border-transparent'
          }`}
          title="Settings"
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>

      {/* Right Side - Status and Quick Actions */}
      <div className="flex items-center space-x-3">
        {/* Model Status */}
        <div className="flex items-center space-x-2 px-3 py-1 bg-black border border-red-500 rounded-lg">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${isModelLoading ? 'animate-pulse' : ''}`} />
          <span className="text-xs text-yellow-400 font-medium">{getStatusText()}</span>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={toggleTheme}
            className="p-2 text-yellow-400 hover:text-orange-400 hover:bg-gray-900 border border-red-500 rounded-md transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'auto' : 'light'} theme`}
          >
            <ThemeIcon />
          </button>
        </div>
      </div>
    </header>

    <ProjectBrowser 
      isOpen={showProjectBrowser}
      onClose={() => setShowProjectBrowser(false)}
      onProjectLoad={handleProjectLoad}
    />
    </>
  )
}

export default Header