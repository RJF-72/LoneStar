import { useState, useEffect } from 'react'
import { X, Folder, FolderOpen, Home, RefreshCw, ArrowUp, HardDrive } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import type { FileSystemItem, Project } from '../../../../shared/types'

interface ProjectBrowserProps {
  isOpen: boolean
  onClose: () => void
  onProjectLoad: (project: Project) => void
}

const ProjectBrowser = ({ isOpen, onClose, onProjectLoad }: ProjectBrowserProps) => {
  const [currentPath, setCurrentPath] = useState<string>('')
  const [directories, setDirectories] = useState<FileSystemItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPath, setSelectedPath] = useState<string>('')

  const { setCurrentProject } = useAppStore()

  useEffect(() => {
    if (isOpen) {
      loadDirectories()
    }
  }, [isOpen])

  const loadDirectories = async (path?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const url = path 
        ? `/api/projects/browse?path=${encodeURIComponent(path)}`
        : '/api/projects/browse'
        
      const response = await fetch(url)
      const result = await response.json()
      
      if (result.success) {
        // If no path provided and we get empty results, provide fallback directories
        if (!path && (!result.data || result.data.length === 0)) {
          // Fallback to common directories
          const fallbackDirs = [
            { name: 'Workspaces', path: '/workspaces', isDirectory: true, size: 0, lastModified: new Date() },
            { name: 'Root (/)', path: '/', isDirectory: true, size: 0, lastModified: new Date() },
            { name: 'Home', path: '/home', isDirectory: true, size: 0, lastModified: new Date() },
            { name: 'User Home (~)', path: process.env.HOME || '/home/vscode', isDirectory: true, size: 0, lastModified: new Date() }
          ]
          setDirectories(fallbackDirs)
        } else {
          setDirectories(result.data || [])
        }
        setCurrentPath(path || '')
      } else {
        setError(result.error || 'Failed to load directories')
      }
    } catch (err) {
      setError('Failed to connect to server')
      console.error('Error loading directories:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDirectoryClick = (item: FileSystemItem) => {
    if (item.isDirectory) {
      setSelectedPath(item.path)
      loadDirectories(item.path)
    }
  }

  const handleLoadProject = async () => {
    if (!selectedPath) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/projects/load', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: selectedPath })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setCurrentProject(result.data)
        onProjectLoad(result.data)
        onClose()
      } else {
        setError(result.error || 'Failed to load project')
      }
    } catch (err) {
      setError('Failed to load project')
      console.error('Error loading project:', err)
    } finally {
      setLoading(false)
    }
  }

  const goToParentDirectory = () => {
    if (currentPath) {
      const parentPath = currentPath.split('/').slice(0, -1).join('/')
      if (parentPath) {
        loadDirectories(parentPath)
        setSelectedPath(parentPath)
      } else {
        loadDirectories()
        setSelectedPath('')
        setCurrentPath('')
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-black border-2 border-red-500 rounded-lg w-4/5 max-w-4xl h-4/5 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-red-500">
          <div className="flex items-center space-x-2">
            <FolderOpen size={20} className="text-orange-400" />
            <h2 className="text-lg font-semibold text-yellow-400">Open Project</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-yellow-400 hover:text-red-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Path Bar */}
        <div className="flex items-center p-3 border-b border-gray-700 bg-gray-900">
          <div className="flex items-center space-x-2 flex-1">
            <button
              onClick={() => loadDirectories()}
              className="p-2 text-yellow-400 hover:text-orange-400 transition-colors border border-red-500 rounded"
              title="Home"
            >
              <Home size={16} />
            </button>
            <button
              onClick={() => loadDirectories('/workspaces')}
              className="px-3 py-1 text-sm text-yellow-400 hover:text-orange-400 border border-red-500 rounded transition-colors"
              title="Go to Workspaces"
            >
              <HardDrive size={14} className="inline mr-1" />
              Workspaces
            </button>
            <button
              onClick={() => loadDirectories('/')}
              className="px-3 py-1 text-sm text-yellow-400 hover:text-orange-400 border border-red-500 rounded transition-colors"
              title="Go to Root"
            >
              Root
            </button>
            {currentPath && (
              <button
                onClick={goToParentDirectory}
                className="px-3 py-1 text-sm text-yellow-400 hover:text-orange-400 border border-red-500 rounded transition-colors"
                title="Go Up"
              >
                <ArrowUp size={14} className="inline mr-1" />
                Back
              </button>
            )}
            <span className="text-sm text-gray-300 font-mono">
              {currentPath || 'Choose a starting location'}
            </span>
          </div>
          <button
            onClick={() => loadDirectories(currentPath)}
            disabled={loading}
            className="p-2 text-yellow-400 hover:text-orange-400 transition-colors disabled:opacity-50 border border-red-500 rounded"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Directory Browser */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-yellow-400">Loading directories...</div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <div className="text-red-400 mb-2">{error}</div>
              <button
                onClick={() => loadDirectories(currentPath)}
                className="px-3 py-2 text-yellow-400 border border-red-500 rounded hover:bg-gray-800"
              >
                Try Again
              </button>
            </div>
          ) : directories.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400">No directories found</div>
            </div>
          ) : (
            <div className="p-2">
              {!currentPath && (
                <div className="mb-4 p-3 bg-gray-900 border border-blue-400 rounded">
                  <h3 className="text-yellow-400 font-medium mb-2">Quick Start</h3>
                  <p className="text-sm text-gray-300">
                    Select a starting location below, then navigate to your project folder.
                    Common locations: Documents, Desktop, or your development workspace.
                  </p>
                </div>
              )}
              
              {directories
                .filter(item => item.isDirectory)
                .map((item) => (
                  <div
                    key={item.path}
                    className={`flex items-center p-3 cursor-pointer hover:bg-gray-800 border-l-2 transition-colors rounded-r ${
                      selectedPath === item.path
                        ? 'bg-blue-900 border-blue-400 text-yellow-400'
                        : 'border-transparent hover:border-red-500 text-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedPath(item.path)
                    }}
                    onDoubleClick={() => handleDirectoryClick(item)}
                  >
                    <Folder size={20} className="mr-3 text-orange-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-xs text-gray-500 font-mono truncate">{item.path}</div>
                    </div>
                    <div className="text-xs text-gray-500 ml-2">
                      Double-click to open
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t-2 border-red-500">
          <div className="text-sm text-gray-400">
            {selectedPath ? (
              <>Selected: <span className="text-yellow-400 font-mono">{selectedPath}</span></>
            ) : (
              'Select a directory to open as project'
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-yellow-400 hover:text-orange-400 border border-red-500 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLoadProject}
              disabled={!selectedPath || loading}
              className="px-4 py-2 bg-blue-600 text-yellow-400 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-400"
            >
              {loading ? 'Loading...' : 'Open Project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectBrowser