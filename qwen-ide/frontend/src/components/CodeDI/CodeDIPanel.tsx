import React, { useState, useEffect } from 'react'
import { Package, Zap, HardDrive, Cpu, Database, ArrowDown, ArrowUp, Play, Edit3 } from 'lucide-react'

interface CodeDIContainer {
  id: string
  name: string
  type: 'model' | 'agent' | 'pipeline' | 'nanobot-swarm' | 'full-system'
  originalSize: number
  compressedSize: number
  compressionRatio: number
  isActive: boolean
  isEditable: boolean
  metadata: {
    version: string
    dependencies: string[]
    capabilities: string[]
    memoryFootprint: number
    processingPower: number
    createdAt: string
    lastModified: string
  }
}

interface CodeDIMetrics {
  totalContainers: number
  totalOriginalSize: number
  totalCompressedSize: number
  memoryEfficiency: number
  activeContainers: number
  availableMemory: number
  compressionSavings: number
}

const CodeDIPanel: React.FC = () => {
  const [metrics, setMetrics] = useState<CodeDIMetrics | null>(null)
  const [containers, setContainers] = useState<CodeDIContainer[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null)

  useEffect(() => {
    fetchMetrics()
    fetchContainers()
    
    // Refresh data every 5 seconds
    const interval = setInterval(() => {
      fetchMetrics()
      fetchContainers()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/codedi/metrics')
      const data = await response.json()
      
      if (data.success) {
        setMetrics(data.data)
        setIsInitialized(true)
      }
    } catch (error) {
      console.error('Failed to fetch CodeDI metrics:', error)
    }
  }

  const fetchContainers = async () => {
    try {
      const response = await fetch('/api/codedi/containers')
      const data = await response.json()
      
      if (data.success) {
        setContainers(data.data.containers)
      }
    } catch (error) {
      console.error('Failed to fetch CodeDI containers:', error)
    }
  }

  const initializeCodeDI = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/codedi/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      
      if (data.success) {
        setMetrics(data.data)
        setIsInitialized(true)
      }
    } catch (error) {
      console.error('Failed to initialize CodeDI:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const activateContainer = async (containerId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/codedi/activate/${containerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      
      if (data.success) {
        await fetchContainers()
      }
    } catch (error) {
      console.error('Failed to activate container:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadLargeModel = async (modelSize: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/codedi/load-large-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelPath: `/models/${modelSize.toLowerCase()}-model.gguf`,
          modelSize,
          compressionLevel: 'maximum'
        })
      })
      const data = await response.json()
      
      if (data.success) {
        await fetchContainers()
        await fetchMetrics()
      }
    } catch (error) {
      console.error('Failed to load large model:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'model': return <Database className="h-5 w-5" />
      case 'agent': return <Cpu className="h-5 w-5" />
      case 'pipeline': return <Zap className="h-5 w-5" />
      default: return <Package className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'model': return 'text-blue-400'
      case 'agent': return 'text-green-400'
      case 'pipeline': return 'text-purple-400'
      case 'nanobot-swarm': return 'text-orange-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="h-full bg-gray-900 text-white p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Package className="h-8 w-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
              CodeDI System
            </h2>
            <p className="text-sm text-gray-400">
              Compressed Distributed Intelligence - Revolutionary Memory Efficiency
            </p>
          </div>
        </div>
        
        {!isInitialized && (
          <button
            onClick={initializeCodeDI}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center space-x-2"
          >
            <Zap className="h-4 w-4" />
            <span>{isLoading ? 'Initializing...' : 'Initialize CodeDI'}</span>
          </button>
        )}
      </div>

      {isInitialized && metrics ? (
        <div className="space-y-6">
          {/* System Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Package className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-gray-300">Containers</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">{metrics.totalContainers}</div>
              <div className="text-xs text-gray-500">{metrics.activeContainers} active</div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <HardDrive className="h-5 w-5 text-green-400" />
                <span className="text-sm text-gray-300">Memory Efficiency</span>
              </div>
              <div className="text-2xl font-bold text-green-400">{metrics.memoryEfficiency.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">savings achieved</div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <ArrowDown className="h-5 w-5 text-purple-400" />
                <span className="text-sm text-gray-300">Memory Saved</span>
              </div>
              <div className="text-2xl font-bold text-purple-400">{formatBytes(metrics.compressionSavings)}</div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <ArrowUp className="h-5 w-5 text-orange-400" />
                <span className="text-sm text-gray-300">Available</span>
              </div>
              <div className="text-2xl font-bold text-orange-400">{formatBytes(metrics.availableMemory)}</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-400" />
              <span>Load Large AI Models</span>
            </h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {['7B', '13B', '30B', '70B'].map((size) => (
                <button
                  key={size}
                  onClick={() => loadLargeModel(size)}
                  disabled={isLoading}
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg disabled:opacity-50 transition-all duration-200 text-center"
                >
                  <div className="text-lg font-bold">{size}</div>
                  <div className="text-xs opacity-75">Model</div>
                </button>
              ))}
            </div>
            
            <p className="text-sm text-gray-400 mt-3">
              Load massive AI models with revolutionary CodeDI compression - maintain full functionality while saving 80%+ memory
            </p>
          </div>

          {/* Container List */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Package className="h-5 w-5 text-green-400" />
              <span>CodeDI Containers</span>
            </h3>

            {containers.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No CodeDI containers yet</p>
                <p className="text-sm mt-2">Load a large model or compress existing components</p>
              </div>
            ) : (
              <div className="space-y-3">
                {containers.map((container) => (
                  <div
                    key={container.id}
                    className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                      selectedContainer === container.id
                        ? 'bg-gray-700 border-blue-400'
                        : 'bg-gray-750 border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedContainer(
                      selectedContainer === container.id ? null : container.id
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`${getTypeColor(container.type)}`}>
                          {getTypeIcon(container.type)}
                        </div>
                        <div>
                          <h4 className="font-medium">{container.name}</h4>
                          <p className="text-sm text-gray-400">
                            {container.type} • {container.compressionRatio.toFixed(1)}:1 compression
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm text-green-400">{formatBytes(container.compressedSize)}</div>
                          <div className="text-xs text-gray-400">
                            was {formatBytes(container.originalSize)}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {container.isActive && (
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          )}
                          
                          {!container.isActive && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                activateContainer(container.id)
                              }}
                              className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-600 rounded transition-colors"
                              title="Activate Container"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          )}
                          
                          {container.isEditable && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                // Handle edit action
                              }}
                              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-600 rounded transition-colors"
                              title="Edit in Compressed State"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {selectedContainer === container.id && (
                      <div className="mt-4 pt-4 border-t border-gray-600">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium text-gray-300 mb-2">Capabilities</h5>
                            <div className="space-y-1">
                              {container.metadata.capabilities.map((capability, index) => (
                                <div key={index} className="text-xs text-gray-400 flex items-center space-x-1">
                                  <div className="w-1 h-1 bg-green-400 rounded-full" />
                                  <span>{capability}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="text-sm font-medium text-gray-300 mb-2">Details</h5>
                            <div className="space-y-1 text-xs text-gray-400">
                              <div>Version: {container.metadata.version}</div>
                              <div>Dependencies: {container.metadata.dependencies.length}</div>
                              <div>Processing Power: {container.metadata.processingPower}</div>
                              <div>Last Modified: {new Date(container.metadata.lastModified).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 p-3 bg-gray-700 rounded text-xs text-gray-300">
                          <strong>Revolutionary Features:</strong> This CodeDI container maintains full functionality while compressed. 
                          Execute operations, edit code, and run AI models directly on compressed data with massive memory savings.
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Package className="h-16 w-16 text-gray-600" />
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              CodeDI System
            </h3>
            <p className="text-sm text-gray-500 max-w-md">
              Revolutionary compression technology that maintains full functionality while compressed.
              Initialize to start compressing AI models, agents, and systems with massive memory savings.
            </p>
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            <span>Processing CodeDI operation...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default CodeDIPanel