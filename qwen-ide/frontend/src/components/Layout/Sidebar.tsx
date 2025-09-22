import { useState } from 'react'
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, Archive, Wrench } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import ProjectBrowser from '../Project/ProjectBrowser'
import ZipManager from '../Archive/ZipManager'
import InstallerWizard from '../Archive/InstallerWizard'
import type { Project } from '../../../../shared/types'

const Sidebar = () => {
  const { currentProject, openFile, activeFile, setCurrentProject } = useAppStore()
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [showProjectBrowser, setShowProjectBrowser] = useState(false)
  const [showZipManager, setShowZipManager] = useState(false)
  const [showInstallerWizard, setShowInstallerWizard] = useState(false)

  const toggleDirectory = (path: string) => {
    setExpandedDirs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  const handleProjectLoad = (project: Project) => {
    setCurrentProject(project)
    setShowProjectBrowser(false)
  }

  const renderFileTree = (files: any[], depth = 0) => {
    return files.map((file) => {
      const isExpanded = expandedDirs.has(file.path)
      const isActive = activeFile === file.path

      return (
        <div key={file.path}>
          <div
            className={`flex items-center px-2 py-1 text-sm cursor-pointer hover:bg-gray-900 border-l-2 transition-colors ${
              isActive ? 'bg-blue-900 border-blue-400 text-yellow-400' : 'text-gray-300 border-transparent hover:border-red-500'
            }`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => {
              if (file.isDirectory) {
                toggleDirectory(file.path)
              } else {
                openFile(file.path)
              }
            }}
          >
            {file.isDirectory ? (
              <>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Folder size={16} className="ml-1 mr-2 text-orange-400" />
                <span>{file.name}</span>
              </>
            ) : (
              <>
                <div className="w-4 ml-1" />
                <File size={16} className="mr-2 text-purple-400" />
                <span>{file.name}</span>
              </>
            )}
          </div>
          
          {file.isDirectory && isExpanded && file.children && (
            <div>
              {renderFileTree(file.children, depth + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <>
      <div className="h-full flex flex-col bg-black border-r-2 border-red-500">
        {/* Simplified Header */}
        <div className="p-3 border-b-2 border-red-500">
          {currentProject ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <Folder size={16} className="text-orange-400 flex-shrink-0" />
                <span className="text-sm font-medium text-yellow-400 truncate">{currentProject.name}</span>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <button
                  onClick={() => setShowZipManager(true)}
                  className="p-1 text-yellow-400 hover:text-orange-400 border border-orange-500 rounded transition-colors"
                  title="Archive Manager"
                >
                  <Archive size={12} />
                </button>
                <button
                  onClick={() => setShowInstallerWizard(true)}
                  className="p-1 text-yellow-400 hover:text-purple-400 border border-purple-500 rounded transition-colors"
                  title="Installer Wizard"
                >
                  <Wrench size={12} />
                </button>
                <button
                  onClick={() => setShowProjectBrowser(true)}
                  className="p-1 text-yellow-400 hover:text-orange-400 border border-red-500 rounded transition-colors"
                  title="Switch Project"
                >
                  <FolderOpen size={12} />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowProjectBrowser(true)}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-yellow-400 rounded text-sm hover:bg-blue-700 transition-colors border border-blue-400"
            >
              <Plus size={16} />
              <span>Open Project</span>
            </button>
          )}
        </div>
        {/* File Tree */}
        <div className="flex-1 overflow-auto scrollbar">
          {currentProject ? (
            <div className="p-2">
              {renderFileTree(currentProject.files)}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center text-gray-500">
              <div>
                <FolderOpen size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">Open a project to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProjectBrowser 
        isOpen={showProjectBrowser}
        onClose={() => setShowProjectBrowser(false)}
        onProjectLoad={handleProjectLoad}
      />
      
      <ZipManager
        isOpen={showZipManager}
        onClose={() => setShowZipManager(false)}
        currentProject={currentProject}
      />
      
      <InstallerWizard
        isOpen={showInstallerWizard}
        onClose={() => setShowInstallerWizard(false)}
        currentProject={currentProject}
      />
    </>
  )
}

export default Sidebar