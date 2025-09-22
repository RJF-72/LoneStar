import React, { useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { 
  Brain, 
  MessageCircle, 
  FileText, 
  Settings, 
  Zap,
  Eye,
  Code,
  Terminal,
  Archive,
  Wrench
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import MainEditor from '../Editor/MainEditor'
import ProjectBrowser from '../Project/ProjectBrowser'
import ZipManager from '../Archive/ZipManager'
import InstallerWizard from '../Archive/InstallerWizard'

const DICentricLayout = () => {
  const { currentProject, setCurrentProject } = useAppStore()
  const [activeMode, setActiveMode] = useState<'chat' | 'code' | 'preview'>('chat')
  const [showProjectBrowser, setShowProjectBrowser] = useState(false)
  const [showZipManager, setShowZipManager] = useState(false)
  const [showInstallerWizard, setShowInstallerWizard] = useState(false)
  
  // DI System State
  const [diInput, setDiInput] = useState('')
  const [diMessages, setDiMessages] = useState<Array<{
    role: 'user' | 'analyzer' | 'generator' | 'optimizer' | 'system'
    content: string
    timestamp: Date
    agentId?: string
  }>>([
    {
      role: 'system',
      content: 'LoneStar DI (Distributed Intelligence) System Ready. Three agents standing by: Analyzer, Generator, Optimizer.',
      timestamp: new Date()
    }
  ])
  const [diLoading, setDiLoading] = useState(false)

  const sendToDI = async () => {
    if (!diInput.trim() || diLoading) return

    const userMessage = {
      role: 'user' as const,
      content: diInput,
      timestamp: new Date()
    }

    setDiMessages(prev => [...prev, userMessage])
    setDiInput('')
    setDiLoading(true)

    try {
      // Send to DI system
      const response = await fetch('/api/ai/multi-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: [
            { agent: 'analyzer', prompt: `Analyze this request: ${diInput}` },
            { agent: 'generator', prompt: `Generate solution for: ${diInput}` },
            { agent: 'optimizer', prompt: `Optimize approach for: ${diInput}` }
          ]
        })
      })

      const result = await response.json()

      if (result.success && result.data) {
        // Add agent responses
        Object.entries(result.data).forEach(([agent, response]: [string, any]) => {
          setDiMessages(prev => [...prev, {
            role: agent as any,
            content: response.result || response.message || 'Processing complete',
            timestamp: new Date(),
            agentId: agent
          }])
        })
      } else {
        setDiMessages(prev => [...prev, {
          role: 'system',
          content: 'DI System encountered an error. Please try again.',
          timestamp: new Date()
        }])
      }
    } catch (error) {
      setDiMessages(prev => [...prev, {
        role: 'system',
        content: 'Failed to connect to DI System. Please check connection.',
        timestamp: new Date()
      }])
    } finally {
      setDiLoading(false)
    }
  }

  const getAgentColor = (role: string) => {
    switch (role) {
      case 'analyzer': return 'text-blue-400 border-blue-500'
      case 'generator': return 'text-green-400 border-green-500'
      case 'optimizer': return 'text-purple-400 border-purple-500'
      case 'user': return 'text-yellow-400 border-yellow-500'
      case 'system': return 'text-gray-400 border-gray-500'
      default: return 'text-white border-gray-600'
    }
  }

  const getAgentIcon = (role: string) => {
    switch (role) {
      case 'analyzer': return <Eye size={14} />
      case 'generator': return <Code size={14} />
      case 'optimizer': return <Zap size={14} />
      case 'user': return <MessageCircle size={14} />
      case 'system': return <Brain size={14} />
      default: return <Brain size={14} />
    }
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* DI-Centric Header */}
      <div className="h-14 bg-gradient-to-r from-black via-gray-900 to-black border-b-2 border-orange-500 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Brain size={24} className="text-orange-400" />
            <h1 className="text-lg font-bold text-yellow-400">LoneStar DI</h1>
            <span className="text-xs text-gray-400">Distributed Intelligence</span>
          </div>
          
          {/* Mode Switcher */}
          <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-1">
            {[
              { id: 'chat', icon: MessageCircle, label: 'DI Chat' },
              { id: 'code', icon: Code, label: 'Code Editor' },
              { id: 'preview', icon: Eye, label: 'Preview' }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id as any)}
                className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
                  activeMode === mode.id
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <mode.icon size={14} />
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Project & Tools */}
        <div className="flex items-center space-x-2">
          {currentProject && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-800 rounded border border-orange-500">
              <FileText size={16} className="text-orange-400" />
              <span className="text-sm text-yellow-400">{currentProject.name}</span>
            </div>
          )}
          
          <button
            onClick={() => setShowProjectBrowser(true)}
            className="p-2 text-yellow-400 hover:text-orange-400 border border-red-500 rounded transition-colors"
            title="Open Project"
          >
            <FileText size={16} />
          </button>
          
          <button
            onClick={() => setShowZipManager(true)}
            className="p-2 text-yellow-400 hover:text-orange-400 border border-orange-500 rounded transition-colors"
            title="Archive Manager"
          >
            <Archive size={16} />
          </button>
          
          <button
            onClick={() => setShowInstallerWizard(true)}
            className="p-2 text-yellow-400 hover:text-purple-400 border border-purple-500 rounded transition-colors"
            title="Installer Wizard"
          >
            <Wrench size={16} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        <PanelGroup direction="horizontal">
          {/* DI Chat Panel */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col border-r-2 border-orange-500">
              {/* DI Header */}
              <div className="h-12 bg-gray-900 border-b border-orange-500 flex items-center justify-between px-4">
                <div className="flex items-center space-x-2">
                  <Brain size={16} className="text-orange-400" />
                  <span className="font-medium text-yellow-400">Distributed Intelligence Chat</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">3 Agents Active</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-orange-500 scrollbar-track-gray-800">
                {diMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex space-x-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg border ${
                      message.role === 'user' 
                        ? 'bg-blue-900 border-blue-500 text-blue-100' 
                        : `bg-gray-900 border-gray-600 text-gray-100 ${getAgentColor(message.role)}`
                    }`}>
                      <div className="flex items-center space-x-2 mb-1">
                        {getAgentIcon(message.role)}
                        <span className="text-xs font-medium capitalize">
                          {message.role === 'user' ? 'You' : message.role}
                        </span>
                        <span className="text-xs text-gray-500">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
                
                {diLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-xs text-gray-400">DI System Processing...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* DI Input */}
              <div className="p-4 border-t border-orange-500 bg-gray-900">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={diInput}
                    onChange={(e) => setDiInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendToDI()}
                    placeholder="Ask the Distributed Intelligence system anything..."
                    disabled={diLoading}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={sendToDI}
                    disabled={diLoading || !diInput.trim()}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    <Brain size={16} />
                    <span>Send to DI</span>
                  </button>
                </div>
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-2 bg-orange-500 hover:bg-orange-400 transition-colors" />

          {/* Content Panel */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full">
              {activeMode === 'chat' && (
                <div className="h-full flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <Brain size={48} className="mx-auto mb-4 text-orange-400 opacity-50" />
                    <h3 className="text-lg font-medium text-yellow-400 mb-2">DI System Overview</h3>
                    <p className="text-gray-400 text-sm max-w-md">
                      The Distributed Intelligence system consists of three specialized agents working in parallel:
                    </p>
                    <div className="mt-4 space-y-2 text-left">
                      <div className="flex items-center space-x-2">
                        <Eye size={16} className="text-blue-400" />
                        <span className="text-sm text-blue-300">Analyzer: Breaks down and understands your requests</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Code size={16} className="text-green-400" />
                        <span className="text-sm text-green-300">Generator: Creates solutions and code</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Zap size={16} className="text-purple-400" />
                        <span className="text-sm text-purple-300">Optimizer: Improves and refines outputs</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeMode === 'code' && (
                <MainEditor />
              )}
              
              {activeMode === 'preview' && (
                <div className="h-full flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <Eye size={48} className="mx-auto mb-4 text-orange-400 opacity-50" />
                    <h3 className="text-lg font-medium text-yellow-400">Preview Mode</h3>
                    <p className="text-gray-400 text-sm">Preview generated content and applications</p>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Terminal Strip */}
      <div className="h-8 bg-black border-t border-orange-500 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <Terminal size={12} className="text-orange-400" />
            <span className="text-gray-400">Ready</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            <span className="text-gray-400">DI System Online</span>
          </div>
          {currentProject && (
            <div className="flex items-center space-x-1">
              <FileText size={12} className="text-orange-400" />
              <span className="text-gray-400">{currentProject.path}</span>
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500">
          LoneStar DI - Distributed Intelligence IDE v1.0.0
        </div>
      </div>

      {/* Modals */}
      <ProjectBrowser
        isOpen={showProjectBrowser}
        onClose={() => setShowProjectBrowser(false)}
        onProjectLoad={(project) => {
          setCurrentProject(project)
          setShowProjectBrowser(false)
        }}
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
    </div>
  )
}

export default DICentricLayout