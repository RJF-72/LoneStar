import React from 'react'
import { Brain, FileText, Zap, Settings } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'

interface WelcomeScreenProps {
  onOpenProject?: () => void
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onOpenProject }) => {
  const { setCurrentProject } = useAppStore()

  const handleQuickStart = () => {
    // Create a demo project
    const demoProject = {
      id: 'demo',
      name: 'Demo Project',
      path: '/workspaces/LoneStar/qwen-ide/examples',
      files: [],
      createdAt: new Date(),
      lastOpened: new Date(),
      settings: {
        aiAssistance: true,
        autoComplete: true,
        syntaxHighlighting: true,
        theme: 'dark' as const,
        fontSize: 14,
        tabSize: 2,
        wordWrap: true
      }
    }
    setCurrentProject(demoProject)
  }

  return (
    <div className="h-screen bg-black text-white flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-8 text-center">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <Brain size={64} className="text-orange-400 mr-4" />
            <div>
              <h1 className="text-6xl font-bold text-yellow-400">LoneStar DI</h1>
              <p className="text-xl text-orange-400 mt-2">Distributed Intelligence IDE</p>
            </div>
          </div>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            The next-generation IDE powered by three specialized AI agents working in parallel with 
            advanced memory compression and distributed processing capabilities.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gray-900 border border-orange-500 rounded-lg p-6">
            <Brain size={32} className="text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">3 Specialized Agents</h3>
            <p className="text-sm text-gray-400">
              Analyzer, Generator, and Optimizer agents work together to understand, create, and refine your code.
            </p>
          </div>
          
          <div className="bg-gray-900 border border-orange-500 rounded-lg p-6">
            <Zap size={32} className="text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">CodeDI Compression</h3>
            <p className="text-sm text-gray-400">
              Revolutionary compression system that maintains full editability while saving massive amounts of memory.
            </p>
          </div>
          
          <div className="bg-gray-900 border border-orange-500 rounded-lg p-6">
            <Settings size={32} className="text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Professional Tools</h3>
            <p className="text-sm text-gray-400">
              Complete archive management, installer wizards, and deployment tools for professional development.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={onOpenProject || (() => {})}
            className="flex items-center space-x-2 px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors border-2 border-orange-500"
          >
            <FileText size={20} />
            <span>Open Project</span>
          </button>
          
          <button
            onClick={handleQuickStart}
            className="flex items-center space-x-2 px-8 py-4 bg-gray-800 hover:bg-gray-700 text-yellow-400 rounded-lg font-medium transition-colors border-2 border-yellow-500"
          >
            <Zap size={20} />
            <span>Quick Start Demo</span>
          </button>
        </div>

        {/* System Status */}
        <div className="mt-12 flex items-center justify-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>DI System Ready</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>CodeDI Engine Online</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <span>Archive Tools Ready</span>
          </div>
        </div>

        <div className="mt-8 text-xs text-gray-600">
          LoneStar DI - Distributed Intelligence IDE v1.0.0 | © 2024
        </div>
      </div>
    </div>
  )
}