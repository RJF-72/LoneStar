import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Settings, ChevronDown } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isLoading?: boolean
}

interface ModelInfo {
  name: string
  filename: string
  path: string
  size: number
  sizeFormatted: string
  modified: string
}

interface ModelStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  modelPath?: string
  error?: string
  loadedAt?: string
}

const ChatPanel = () => {
  const { activeFile, fileContents } = useAppStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([])
  const [currentModel, setCurrentModel] = useState<ModelStatus | null>(null)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [modelSwitching, setModelSwitching] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load available models and current model status on component mount
  useEffect(() => {
    loadAvailableModels()
    loadCurrentModelStatus()
  }, [])

  const loadAvailableModels = async () => {
    try {
      const response = await fetch('/api/model/available')
      const data = await response.json()
      if (data.success) {
        setAvailableModels(data.data)
      }
    } catch (error) {
      console.error('Failed to load available models:', error)
    }
  }

  const loadCurrentModelStatus = async () => {
    try {
      const response = await fetch('/api/model/status')
      const data = await response.json()
      if (data.success) {
        setCurrentModel(data.data)
      }
    } catch (error) {
      console.error('Failed to load current model status:', error)
    }
  }

  const switchModel = async (modelName: string) => {
    setModelSwitching(true)
    try {
      const response = await fetch('/api/model/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelName })
      })
      
      const data = await response.json()
      if (data.success) {
        setCurrentModel(data.data)
        setShowModelSelector(false)
        // Clear messages when switching models
        setMessages([])
      } else {
        console.error('Failed to switch model:', data.error)
      }
    } catch (error) {
      console.error('Failed to switch model:', error)
    } finally {
      setModelSwitching(false)
    }
  }

  const sendMessage = async () => {
    if (!currentMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date()
    }

    // Add user message
    setMessages(prev => [...prev, userMessage])
    
    const messageContent = currentMessage
    setCurrentMessage('')
    setIsLoading(true)

    // Add loading message
    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: 'Thinking...',
      timestamp: new Date(),
      isLoading: true
    }

    setMessages(prev => [...prev, loadingMessage])

    try {
      const context = {
        project: 'LoneStar IDE',
        currentFile: activeFile,
        fileContent: activeFile && fileContents[activeFile] ? fileContents[activeFile] : undefined
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          context
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Remove loading message and add AI response
        setMessages(prev => [
          ...prev.filter(m => !m.isLoading),
          {
            id: Date.now().toString(),
            role: 'assistant' as const,
            content: data.data.message,
            timestamp: new Date()
          }
        ])
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove loading message on error
      setMessages(prev => prev.filter(m => !m.isLoading))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-full flex flex-col bg-black border-l-2 border-red-500">
      {/* Header */}
      <div className="p-4 border-b-2 border-red-500 bg-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-orange-400" />
            <h1 className="text-yellow-400 text-lg font-semibold">AI Assistant</h1>
          </div>
          
          {/* Model Selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              disabled={modelSwitching}
              className="flex items-center gap-2 text-xs text-yellow-400 bg-black hover:bg-gray-900 border border-red-500 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={`w-2 h-2 rounded-full ${
                currentModel?.status === 'connected' ? 'bg-blue-400' : 
                currentModel?.status === 'connecting' ? 'bg-orange-400' : 
                'bg-purple-400'
              }`}></span>
              <span>
                {modelSwitching ? 'Switching...' : 
                 currentModel?.modelPath ? 
                 currentModel.modelPath.replace('./models/', '').replace('.gguf', '') : 
                 'No Model'}
              </span>
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {/* Dropdown Menu */}
            {showModelSelector && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-black border-2 border-red-500 rounded-lg shadow-lg z-50">
                <div className="p-2">
                  <div className="text-xs text-yellow-400 mb-2 px-2">Available Models:</div>
                  {availableModels.length === 0 ? (
                    <div className="text-xs text-gray-400 px-2 py-1">No models found</div>
                  ) : (
                    availableModels.map((model) => (
                      <button
                        key={model.name}
                        onClick={() => switchModel(model.name)}
                        disabled={modelSwitching}
                        className={`w-full text-left px-2 py-2 text-xs rounded hover:bg-gray-900 transition-colors disabled:opacity-50 ${
                          currentModel?.modelPath === model.path ? 'bg-gray-900 text-blue-400 border border-red-500' : 'text-yellow-400'
                        }`}
                      >
                        <div className="font-medium">{model.name}</div>
                        <div className="text-gray-400">{model.sizeFormatted}</div>
                      </button>
                    ))
                  )}
                </div>
                <div className="border-t border-red-500 p-2">
                  <button
                    onClick={() => setShowModelSelector(false)}
                    className="w-full text-xs text-yellow-400 hover:text-orange-400 px-2 py-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-orange-400" />
            <p className="text-yellow-400">Start a conversation with AI!</p>
            <p className="text-sm mt-2 text-gray-400">Ask about your code, get help with development, or chat about anything.</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              message.role === 'user' 
                ? 'bg-blue-600 border-blue-400' 
                : message.isLoading 
                  ? 'bg-orange-600 border-orange-400' 
                  : 'bg-purple-600 border-purple-400'
            }`}>
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-yellow-400" />
              ) : (
                <Bot className="w-4 h-4 text-yellow-400" />
              )}
            </div>
            <div className={`flex-1 max-w-3xl ${message.role === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block px-4 py-2 rounded-lg border-2 ${
                message.role === 'user'
                  ? 'bg-blue-900 border-blue-400 text-yellow-400'
                  : message.isLoading
                    ? 'bg-black border-orange-400 text-orange-400'
                    : 'bg-black border-purple-400 text-yellow-400'
              }`}>
                {message.isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full"></div>
                    {message.content}
                  </div>
                ) : message.role === 'assistant' ? (
                  <ReactMarkdown
                    components={{
                      code: ({ node, inline, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                          <SyntaxHighlighter
                            language={match[1]}
                            style={vscDarkPlus as any}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t-2 border-red-500 bg-black">
        <div className="flex gap-2">
          <textarea
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your code or get development help..."
            className="flex-1 bg-black border-2 border-red-500 text-yellow-400 px-4 py-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-400"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!currentMessage.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-900 disabled:cursor-not-allowed text-yellow-400 border-2 border-blue-400 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatPanel