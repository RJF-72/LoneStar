import { useState } from 'react'
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'

const Sidebar = () => {
  const { currentProject, openFile, activeFile } = useAppStore()
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())

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

  const renderFileTree = (files: any[], depth = 0) => {
    return files.map((file) => {
      const isExpanded = expandedDirs.has(file.path)
      const isActive = activeFile === file.path

      return (
        <div key={file.path}>
          <div
            className={`flex items-center px-2 py-1 text-sm cursor-pointer hover:bg-gray-700 ${
              isActive ? 'bg-qwen-primary text-white' : 'text-gray-300'
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
                <Folder size={16} className="ml-1 mr-2 text-blue-400" />
                <span>{file.name}</span>
              </>
            ) : (
              <>
                <div className="w-4 ml-1" />
                <File size={16} className="mr-2 text-gray-400" />
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
    <div className="h-full flex flex-col bg-gray-800">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
          File Explorer
        </h2>
      </div>
      
      <div className="flex-1 overflow-auto scrollbar">
        {currentProject ? (
          <div className="p-2">
            {renderFileTree(currentProject.files)}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-400">
            <p className="text-sm">No project opened</p>
            <button className="mt-2 px-3 py-1 bg-qwen-primary text-white rounded text-xs hover:bg-qwen-primary/80 transition-colors">
              Open Project
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar