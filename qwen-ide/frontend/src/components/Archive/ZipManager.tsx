import React, { useState } from 'react'
import { 
  Archive, 
  FileArchive, 
  Download, 
  Upload, 
  FolderArchive, 
  Package,
  Settings,
  Loader,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react'

interface ZipManagerProps {
  isOpen: boolean
  onClose: () => void
  currentProject?: any
}

const ZipManager: React.FC<ZipManagerProps> = ({ isOpen, onClose, currentProject }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'extract' | 'project'>('create')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null)
  
  // Create Archive State
  const [sourcePath, setSourcePath] = useState('')
  const [outputPath, setOutputPath] = useState('')
  const [zipOptions, setZipOptions] = useState({
    includeHidden: false,
    excludePatterns: ['node_modules', '.git', 'dist', 'build'],
    compressionLevel: 6
  })
  
  // Extract Archive State
  const [zipPath, setZipPath] = useState('')
  const [extractPath, setExtractPath] = useState('')
  
  // Project Archive State
  const [projectPath, setProjectPath] = useState(currentProject?.path || '')
  const [projectOutputDir, setProjectOutputDir] = useState('')
  const [projectName, setProjectName] = useState(currentProject?.name || '')

  const createZipArchive = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/zip/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourcePath,
          outputPath,
          options: zipOptions
        })
      })
      
      const result = await response.json()
      setResult(result)
    } catch (error) {
      setResult({
        success: false,
        message: `Failed to create zip: ${error}`
      })
    } finally {
      setLoading(false)
    }
  }

  const extractZipArchive = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/zip/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zipPath,
          outputPath: extractPath
        })
      })
      
      const result = await response.json()
      setResult(result)
    } catch (error) {
      setResult({
        success: false,
        message: `Failed to extract zip: ${error}`
      })
    } finally {
      setLoading(false)
    }
  }

  const createProjectArchive = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/zip/project-archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          outputDir: projectOutputDir,
          projectName
        })
      })
      
      const result = await response.json()
      setResult(result)
    } catch (error) {
      setResult({
        success: false,
        message: `Failed to create project archive: ${error}`
      })
    } finally {
      setLoading(false)
    }
  }

  const createDeploymentPackage = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/zip/deployment-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          outputDir: projectOutputDir,
          buildScript: 'npm run build'
        })
      })
      
      const result = await response.json()
      setResult(result)
    } catch (error) {
      setResult({
        success: false,
        message: `Failed to create deployment package: ${error}`
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-black border-2 border-orange-500 rounded-lg w-4/5 max-w-4xl h-4/5 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-orange-500">
          <div className="flex items-center space-x-2">
            <Archive size={20} className="text-orange-400" />
            <h2 className="text-lg font-semibold text-yellow-400">Zip & Archive Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-yellow-400 hover:text-red-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'create', label: 'Create Archive', icon: FolderArchive },
            { id: 'extract', label: 'Extract Archive', icon: FileArchive },
            { id: 'project', label: 'Project Archives', icon: Package }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-orange-400 text-yellow-400'
                  : 'text-gray-400 hover:text-yellow-400'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-auto">
          {/* Create Archive Tab */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">
                  Source Directory
                </label>
                <input
                  type="text"
                  value={sourcePath}
                  onChange={(e) => setSourcePath(e.target.value)}
                  placeholder="Path to directory to archive..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">
                  Output Zip File
                </label>
                <input
                  type="text"
                  value={outputPath}
                  onChange={(e) => setOutputPath(e.target.value)}
                  placeholder="Path for output zip file..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-yellow-400 mb-2">
                    Compression Level
                  </label>
                  <select
                    value={zipOptions.compressionLevel}
                    onChange={(e) => setZipOptions({
                      ...zipOptions,
                      compressionLevel: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                  >
                    <option value={0}>No Compression</option>
                    <option value={1}>Fastest</option>
                    <option value={6}>Balanced</option>
                    <option value={9}>Best Compression</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-yellow-400">
                    Options
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeHidden"
                      checked={zipOptions.includeHidden}
                      onChange={(e) => setZipOptions({
                        ...zipOptions,
                        includeHidden: e.target.checked
                      })}
                      className="rounded"
                    />
                    <label htmlFor="includeHidden" className="text-sm text-gray-300">
                      Include hidden files
                    </label>
                  </div>
                </div>
              </div>

              <button
                onClick={createZipArchive}
                disabled={loading || !sourcePath || !outputPath}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? <Loader className="animate-spin" size={16} /> : <Archive size={16} />}
                <span>{loading ? 'Creating Archive...' : 'Create Zip Archive'}</span>
              </button>
            </div>
          )}

          {/* Extract Archive Tab */}
          {activeTab === 'extract' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">
                  Zip File to Extract
                </label>
                <input
                  type="text"
                  value={zipPath}
                  onChange={(e) => setZipPath(e.target.value)}
                  placeholder="Path to zip file..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">
                  Extract to Directory
                </label>
                <input
                  type="text"
                  value={extractPath}
                  onChange={(e) => setExtractPath(e.target.value)}
                  placeholder="Directory to extract to..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                />
              </div>

              <button
                onClick={extractZipArchive}
                disabled={loading || !zipPath || !extractPath}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? <Loader className="animate-spin" size={16} /> : <FileArchive size={16} />}
                <span>{loading ? 'Extracting...' : 'Extract Archive'}</span>
              </button>
            </div>
          )}

          {/* Project Archives Tab */}
          {activeTab === 'project' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">
                  Project Path
                </label>
                <input
                  type="text"
                  value={projectPath}
                  onChange={(e) => setProjectPath(e.target.value)}
                  placeholder="Path to project directory..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-yellow-400 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Project name..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-yellow-400 mb-2">
                    Output Directory
                  </label>
                  <input
                    type="text"
                    value={projectOutputDir}
                    onChange={(e) => setProjectOutputDir(e.target.value)}
                    placeholder="Where to save archives..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={createProjectArchive}
                  disabled={loading || !projectPath || !projectOutputDir}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? <Loader className="animate-spin" size={16} /> : <Package size={16} />}
                  <span>{loading ? 'Creating...' : 'Create Project Archive'}</span>
                </button>

                <button
                  onClick={createDeploymentPackage}
                  disabled={loading || !projectPath || !projectOutputDir}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? <Loader className="animate-spin" size={16} /> : <Download size={16} />}
                  <span>{loading ? 'Building...' : 'Create Deployment Package'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className={`mt-4 p-4 rounded border ${
              result.success 
                ? 'bg-green-900 border-green-500 text-green-200' 
                : 'bg-red-900 border-red-500 text-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                {result.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span className="font-medium">
                  {result.success ? 'Success!' : 'Error'}
                </span>
              </div>
              <p className="mt-2">{result.message}</p>
              {result.success && result.data && (
                <div className="mt-2 text-sm">
                  <pre className="bg-black bg-opacity-30 p-2 rounded overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ZipManager