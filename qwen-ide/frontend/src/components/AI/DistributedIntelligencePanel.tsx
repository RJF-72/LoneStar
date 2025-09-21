import React, { useState, useEffect } from 'react'
import { Brain, Zap, Activity, Target, TrendingUp, Cpu } from 'lucide-react'

interface SystemStats {
  isInitialized: boolean
  agents: number
  pipelines: number
  threads: number
  nanobots: number
  performance: {
    memoryUsage: number
    systemLoad: number
    averageResponseTime: number
    bottleneckCount: number
    totalTasks: number
    completedTasks: number
  }
  timestamp: number
}

const DistributedIntelligencePanel: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Fetch initial system status
    fetchSystemStatus()
    
    // Set up periodic updates every 2 seconds
    const interval = setInterval(fetchSystemStatus, 2000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/ai/status')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error)
    }
  }

  const initializeSystem = async () => {
    setIsInitializing(true)
    try {
      const response = await fetch('/api/ai/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to initialize system:', error)
    } finally {
      setIsInitializing(false)
    }
  }

  const analyzeCode = async (code: string, context?: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, context })
      })
      const data = await response.json()
      
      if (data.success) {
        return data.data.analysis
      }
    } catch (error) {
      console.error('Code analysis failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getMemoryEfficiency = () => {
    if (!stats) return 0
    return Math.max(0, Math.min(100, (1 - stats.performance.memoryUsage / 1000) * 100))
  }

  const getSystemLoadPercentage = () => {
    if (!stats) return 0
    return Math.min(100, stats.performance.systemLoad * 100)
  }

  const getBottleneckStatus = () => {
    if (!stats) return 'Unknown'
    return stats.performance.bottleneckCount === 0 ? 'Optimal' : `${stats.performance.bottleneckCount} detected`
  }

  return (
    <div className="h-full bg-gray-900 text-white p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="h-8 w-8 text-purple-400" />
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              Distributed Intelligence
            </h2>
            <p className="text-sm text-gray-400">
              Revolutionary Multi-Agent System with Nanobot Swarms
            </p>
          </div>
        </div>
        
        {!stats?.isInitialized && (
          <button
            onClick={initializeSystem}
            disabled={isInitializing}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 flex items-center space-x-2"
          >
            <Zap className="h-4 w-4" />
            <span>{isInitializing ? 'Initializing...' : 'Initialize'}</span>
          </button>
        )}
      </div>

      {stats?.isInitialized ? (
        <div className="space-y-6">
          {/* System Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="h-5 w-5 text-purple-400" />
                <span className="text-sm text-gray-300">Agents</span>
              </div>
              <div className="text-2xl font-bold text-purple-400">{stats.agents}</div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-gray-300">Pipelines</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">{stats.pipelines}</div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="h-5 w-5 text-green-400" />
                <span className="text-sm text-gray-300">Threads</span>
              </div>
              <div className="text-2xl font-bold text-green-400">{stats.threads}</div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-5 w-5 text-orange-400" />
                <span className="text-sm text-gray-300">Nanobots</span>
              </div>
              <div className="text-2xl font-bold text-orange-400">{stats.nanobots.toLocaleString()}</div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              <span>Real-Time Performance</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-300 mb-1">Memory Efficiency</div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getMemoryEfficiency()}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{getMemoryEfficiency().toFixed(1)}%</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-300 mb-1">System Load</div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getSystemLoadPercentage()}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{getSystemLoadPercentage().toFixed(1)}%</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-300 mb-1">Response Time</div>
                <div className="text-lg font-bold text-green-400">
                  {stats.performance.averageResponseTime.toFixed(2)}ms
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-300 mb-1">Bottleneck Status</div>
                <div className={`text-sm font-medium ${
                  stats.performance.bottleneckCount === 0 ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {getBottleneckStatus()}
                </div>
              </div>
            </div>
          </div>

          {/* Task Statistics */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Cpu className="h-5 w-5 text-blue-400" />
              <span>Task Processing</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-300 mb-1">Total Tasks</div>
                <div className="text-2xl font-bold text-blue-400">{stats.performance.totalTasks}</div>
              </div>

              <div>
                <div className="text-sm text-gray-300 mb-1">Completed Tasks</div>
                <div className="text-2xl font-bold text-green-400">{stats.performance.completedTasks}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-gray-300 mb-2">Completion Rate</div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${stats.performance.totalTasks > 0 ? 
                        (stats.performance.completedTasks / stats.performance.totalTasks) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {stats.performance.totalTasks > 0 ? 
                    ((stats.performance.completedTasks / stats.performance.totalTasks) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Architecture Overview */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">SOTA Architecture</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <p>• <span className="text-purple-400">3 Specialized Agents:</span> Analyzer, Generator, Optimizer</p>
              <p>• <span className="text-blue-400">Fiber Optic Pipelines:</span> 3 per agent, 9 total</p>
              <p>• <span className="text-green-400">High-Performance Threads:</span> 50 per pipeline, 450+ total</p>
              <p>• <span className="text-orange-400">Nanobot Swarms:</span> 12,000+ per pipeline, 108,000+ total</p>
              <p>• <span className="text-red-400">Memory Optimization:</span> Real-time bottleneck prevention</p>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="text-center">
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
              stats.performance.bottleneckCount === 0 ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                stats.performance.bottleneckCount === 0 ? 'bg-green-400' : 'bg-yellow-400'
              } animate-pulse`} />
              <span className="text-sm font-medium">
                System Operating at {stats.performance.bottleneckCount === 0 ? 'Peak Performance' : 'Optimizing Performance'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Brain className="h-16 w-16 text-gray-600" />
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              Distributed Intelligence System
            </h3>
            <p className="text-sm text-gray-500 max-w-md">
              Initialize the revolutionary multi-agent system to unlock SOTA performance with 
              fiber optic pipelines and nanobot swarms.
            </p>
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
            <span>Processing with nanobots...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default DistributedIntelligencePanel