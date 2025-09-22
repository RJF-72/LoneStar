import React, { useState, useEffect } from 'react'
import { 
  Wrench,
  Package2, 
  Monitor,
  Apple,
  Smartphone,
  Settings,
  Download,
  Loader,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  Zap
} from 'lucide-react'

interface InstallerWizardProps {
  isOpen: boolean
  onClose: () => void
  currentProject?: any
}

interface InstallerConfig {
  appName: string
  version: string
  description: string
  author: string
  homepage?: string
  license?: string
  executable: string
  installDir?: string
  shortcuts?: {
    desktop: boolean
    startMenu: boolean
  }
}

const InstallerWizard: React.FC<InstallerWizardProps> = ({ isOpen, onClose, currentProject }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<InstallerConfig>({
    appName: '',
    version: '1.0.0',
    description: '',
    author: '',
    executable: '',
    shortcuts: {
      desktop: true,
      startMenu: true
    }
  })
  
  const [projectPath, setProjectPath] = useState(currentProject?.path || '')
  const [outputPath, setOutputPath] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['windows'])
  const [results, setResults] = useState<any>(null)

  const steps = [
    { title: 'Project Configuration', icon: Settings },
    { title: 'Platform Selection', icon: Monitor },
    { title: 'Build & Package', icon: Package2 },
    { title: 'Results', icon: CheckCircle }
  ]

  useEffect(() => {
    if (currentProject) {
      setProjectPath(currentProject.path)
      generateConfig()
    }
  }, [currentProject])

  const generateConfig = async () => {
    if (!projectPath) return
    
    try {
      const response = await fetch('/api/installer/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath })
      })
      
      const result = await response.json()
      if (result.success) {
        setConfig(result.data)
      }
    } catch (error) {
      console.error('Failed to generate config:', error)
    }
  }

  const createInstallers = async () => {
    setLoading(true)
    setResults(null)
    
    try {
      const response = await fetch('/api/installer/multi-platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          outputPath,
          config,
          platforms: selectedPlatforms
        })
      })
      
      const result = await response.json()
      setResults(result)
      if (result.success) {
        setCurrentStep(3)
      }
    } catch (error) {
      setResults({
        success: false,
        message: `Failed to create installers: ${error}`
      })
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-black border-2 border-purple-500 rounded-lg w-4/5 max-w-4xl h-4/5 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-purple-500">
          <div className="flex items-center space-x-2">
            <Wrench size={20} className="text-purple-400" />
            <h2 className="text-lg font-semibold text-yellow-400">Professional Installer Wizard</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-yellow-400 hover:text-red-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index <= currentStep 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-600 text-gray-400'
              }`}>
                {index < currentStep ? (
                  <CheckCircle size={16} />
                ) : (
                  <step.icon size={16} />
                )}
              </div>
              <span className={`text-sm ${
                index <= currentStep ? 'text-yellow-400' : 'text-gray-400'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 ${
                  index < currentStep ? 'bg-purple-600' : 'bg-gray-600'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-auto">
          {/* Step 0: Project Configuration */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-yellow-400">Configure Your Application</h3>
              
              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">
                  Project Path
                </label>
                <input
                  type="text"
                  value={projectPath}
                  onChange={(e) => setProjectPath(e.target.value)}
                  placeholder="Path to your project..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                />
                <button
                  onClick={generateConfig}
                  className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Auto-detect Configuration
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-yellow-400 mb-2">
                    Application Name
                  </label>
                  <input
                    type="text"
                    value={config.appName}
                    onChange={(e) => setConfig({...config, appName: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-yellow-400 mb-2">
                    Version
                  </label>
                  <input
                    type="text"
                    value={config.version}
                    onChange={(e) => setConfig({...config, version: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">
                  Description
                </label>
                <textarea
                  value={config.description}
                  onChange={(e) => setConfig({...config, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-yellow-400 mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={config.author}
                    onChange={(e) => setConfig({...config, author: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-yellow-400 mb-2">
                    Main Executable
                  </label>
                  <input
                    type="text"
                    value={config.executable}
                    onChange={(e) => setConfig({...config, executable: e.target.value})}
                    placeholder="main.js, app.exe, etc."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">
                  Shortcuts
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="desktop"
                      checked={config.shortcuts?.desktop || false}
                      onChange={(e) => setConfig({
                        ...config,
                        shortcuts: {
                          ...config.shortcuts,
                          desktop: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                    <label htmlFor="desktop" className="text-sm text-gray-300">
                      Create desktop shortcut
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="startMenu"
                      checked={config.shortcuts?.startMenu || false}
                      onChange={(e) => setConfig({
                        ...config,
                        shortcuts: {
                          ...config.shortcuts,
                          startMenu: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                    <label htmlFor="startMenu" className="text-sm text-gray-300">
                      Add to Start Menu
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Platform Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-yellow-400">Select Target Platforms</h3>
              
              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">
                  Output Directory
                </label>
                <input
                  type="text"
                  value={outputPath}
                  onChange={(e) => setOutputPath(e.target.value)}
                  placeholder="Where to save installers..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'windows', name: 'Windows', icon: Monitor, description: 'MSI & EXE installers' },
                  { id: 'macos', name: 'macOS', icon: Apple, description: 'DMG & PKG packages' },
                  { id: 'linux', name: 'Linux', icon: Smartphone, description: 'DEB & RPM packages' },
                  { id: 'portable', name: 'Portable', icon: Package2, description: 'Cross-platform ZIP' }
                ].map(platform => (
                  <div
                    key={platform.id}
                    className={`p-4 border rounded cursor-pointer transition-colors ${
                      selectedPlatforms.includes(platform.id)
                        ? 'border-purple-500 bg-purple-900 bg-opacity-30'
                        : 'border-gray-600 hover:border-purple-400'
                    }`}
                    onClick={() => {
                      if (selectedPlatforms.includes(platform.id)) {
                        setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.id))
                      } else {
                        setSelectedPlatforms([...selectedPlatforms, platform.id])
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <platform.icon size={24} className="text-purple-400" />
                      <div>
                        <h4 className="font-medium text-white">{platform.name}</h4>
                        <p className="text-sm text-gray-400">{platform.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Build & Package */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-yellow-400">Build & Package</h3>
              
              <div className="bg-gray-900 p-4 rounded border">
                <h4 className="font-medium text-white mb-2">Configuration Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">App Name:</span>
                    <span className="text-white ml-2">{config.appName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Version:</span>
                    <span className="text-white ml-2">{config.version}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Platforms:</span>
                    <span className="text-white ml-2">{selectedPlatforms.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Output:</span>
                    <span className="text-white ml-2">{outputPath}</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={createInstallers}
                  disabled={loading || !outputPath || selectedPlatforms.length === 0}
                  className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                >
                  {loading ? <Loader className="animate-spin" size={20} /> : <Zap size={20} />}
                  <span>{loading ? 'Building Installers...' : 'Create Professional Installers'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-yellow-400">Installer Creation Results</h3>
              
              {results && (
                <div className={`p-4 rounded border ${
                  results.success 
                    ? 'bg-green-900 border-green-500' 
                    : 'bg-red-900 border-red-500'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {results.success ? (
                      <CheckCircle className="text-green-400" size={20} />
                    ) : (
                      <AlertCircle className="text-red-400" size={20} />
                    )}
                    <span className="font-medium text-white">
                      {results.success ? 'Installers Created Successfully!' : 'Error Creating Installers'}
                    </span>
                  </div>
                  
                  {results.success && results.data?.installers && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium text-white">Created Installers:</h4>
                      {Object.entries(results.data.installers).map(([platform, path]) => (
                        <div key={platform} className="flex items-center space-x-2 text-sm">
                          <FileText size={16} className="text-green-400" />
                          <span className="text-gray-300 capitalize">{platform}:</span>
                          <span className="text-white font-mono">{path as string}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {!results.success && (
                    <p className="text-red-200 mt-2">{results.message}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t-2 border-purple-500">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-4 py-2 text-yellow-400 hover:text-orange-400 border border-purple-500 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-yellow-400 hover:text-orange-400 border border-red-500 rounded transition-colors"
            >
              Close
            </button>
            {currentStep < 2 && (
              <button
                onClick={nextStep}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstallerWizard