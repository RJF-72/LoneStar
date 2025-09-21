import { useState } from 'react'
import { 
  File, 
  MessageSquare, 
  Terminal, 
  Settings, 
  Play, 
  Save, 
  FolderOpen,
  Sun,
  Moon,
  Monitor,
  Eye,
  EyeOff
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'

const Header = () => {
  const { 
    theme, 
    setTheme, 
    activePanel, 
    setActivePanel, 
    currentProject,
    modelStatus,
    isModelLoading
  } = useAppStore()

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
    <header className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
      {/* Left Side - Logo and Project */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">★</span>
          </div>
          <h1 className="text-lg font-semibold text-white">LoneStar IDE</h1>
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">Qwen3:4B</span>
        </div>
        
        {currentProject && (
          <div className="flex items-center space-x-2 text-gray-300">
            <FolderOpen size={16} />
            <span className="text-sm">{currentProject.name}</span>
          </div>
        )}
      </div>

      {/* Center - Panel Navigation */}
      <div className="flex items-center space-x-1 bg-gray-900 rounded-lg p-1">
        <button
          onClick={() => setActivePanel('files')}
          className={`px-3 py-1.5 rounded-md flex items-center space-x-2 text-sm transition-colors ${
            activePanel === 'files'
              ? 'bg-qwen-primary text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          <File size={16} />
          <span>Files</span>
        </button>
        
        <button
          onClick={() => setActivePanel('chat')}
          className={`px-3 py-1.5 rounded-md flex items-center space-x-2 text-sm transition-colors ${
            activePanel === 'chat'
              ? 'bg-qwen-primary text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          <MessageSquare size={16} />
          <span>Chat</span>
        </button>
        
        <button
          onClick={() => setActivePanel('terminal')}
          className={`px-3 py-1.5 rounded-md flex items-center space-x-2 text-sm transition-colors ${
            activePanel === 'terminal'
              ? 'bg-qwen-primary text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Terminal size={16} />
          <span>Terminal</span>
        </button>
        
        <button
          onClick={() => setActivePanel('settings')}
          className={`px-3 py-1.5 rounded-md flex items-center space-x-2 text-sm transition-colors ${
            activePanel === 'settings'
              ? 'bg-qwen-primary text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>

      {/* Right Side - Actions and Status */}
      <div className="flex items-center space-x-4">
        {/* Model Status */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${isModelLoading ? 'animate-pulse' : ''}`} />
          <span className="text-xs text-gray-300">{getStatusText()}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
            title="Save File"
          >
            <Save size={16} />
          </button>
          
          <button
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
            title="Run Code"
          >
            <Play size={16} />
          </button>
          
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'auto' : 'light'} theme`}
          >
            <ThemeIcon />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header