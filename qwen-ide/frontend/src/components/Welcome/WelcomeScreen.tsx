import { useState } from 'react'
import { FolderOpen, MessageSquare, FileText, Play, Star, ArrowRight } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import ProjectBrowser from '../Project/ProjectBrowser'
import type { Project } from '../../../../shared/types'

const WelcomeScreen = () => {
  const [showProjectBrowser, setShowProjectBrowser] = useState(false)
  const { setCurrentProject, setActivePanel } = useAppStore()

  const handleProjectLoad = (project: Project) => {
    setCurrentProject(project)
  }

  const quickActions = [
    {
      icon: FolderOpen,
      title: 'Open Project',
      description: 'Browse and open any folder from your computer',
      action: () => setShowProjectBrowser(true),
      color: 'text-orange-400',
      borderColor: 'border-orange-400',
      bgColor: 'bg-orange-400/10'
    },
    {
      icon: MessageSquare,
      title: 'Start AI Chat',
      description: 'Chat with Qwen3:4B for coding assistance',
      action: () => setActivePanel('chat'),
      color: 'text-blue-400',
      borderColor: 'border-blue-400',
      bgColor: 'bg-blue-400/10'
    },
    {
      icon: FileText,
      title: 'Create New File',
      description: 'Start coding in a new file',
      action: () => {
        // TODO: Implement new file creation
        console.log('Create new file')
      },
      color: 'text-green-400',
      borderColor: 'border-green-400',
      bgColor: 'bg-green-400/10'
    }
  ]

  const recentFeatures = [
    'Multi-model AI support with Qwen3:4B',
    'Real-time file system browsing',
    'Integrated terminal and chat',
    'Project-aware code assistance'
  ]

  return (
    <>
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="max-w-4xl w-full p-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-purple-500 border-2 border-yellow-400 rounded-2xl flex items-center justify-center mr-4">
                <Star className="text-yellow-400 w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-yellow-400 mb-2">LoneStar IDE</h1>
                <p className="text-lg text-gray-300">AI-Powered Development Environment</p>
              </div>
            </div>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Welcome to LoneStar IDE! Get started by opening a project from your computer, 
              or dive right in with our AI assistant powered by Qwen3:4B.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className={`p-6 border-2 ${action.borderColor} rounded-lg ${action.bgColor} hover:bg-opacity-20 transition-all group`}
                >
                  <div className="flex flex-col items-center text-center">
                    <IconComponent className={`w-12 h-12 ${action.color} mb-4 group-hover:scale-110 transition-transform`} />
                    <h3 className="text-xl font-semibold text-yellow-400 mb-2">{action.title}</h3>
                    <p className="text-gray-300 text-sm mb-3">{action.description}</p>
                    <ArrowRight className={`w-5 h-5 ${action.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </div>
                </button>
              )
            })}
          </div>

          {/* Features */}
          <div className="bg-gray-900 border-2 border-red-500 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">✨ What's New in LoneStar IDE</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {recentFeatures.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              💡 <strong>Pro Tip:</strong> Use the AI chat to get help with coding, debugging, or learning new concepts.
              The AI understands your project context once you open a folder.
            </p>
          </div>
        </div>
      </div>

      <ProjectBrowser 
        isOpen={showProjectBrowser}
        onClose={() => setShowProjectBrowser(false)}
        onProjectLoad={handleProjectLoad}
      />
    </>
  )
}

export default WelcomeScreen