import { useState, useEffect } from 'react'
import { Eye, EyeOff, ExternalLink, RefreshCw, Copy, Download } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useAppStore } from '../../stores/appStore'
import toast from 'react-hot-toast'

interface PreviewProps {
  content?: string
  filePath?: string
  language?: string
}

const Preview = ({ content, filePath, language }: PreviewProps) => {
  const { activeFile, fileContents, theme } = useAppStore()
  const [previewMode, setPreviewMode] = useState<'split' | 'preview-only' | 'hidden'>('split')
  const [previewContent, setPreviewContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // Get content from props or store
  const displayContent = content || (activeFile ? fileContents[activeFile] : '') || ''
  const displayLanguage = language || getLanguageFromPath(filePath || activeFile || '')

  useEffect(() => {
    if (displayContent) {
      generatePreview(displayContent, displayLanguage)
    }
  }, [displayContent, displayLanguage])

  const getLanguageFromPath = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'md': case 'markdown': return 'markdown'
      case 'html': case 'htm': return 'html'
      case 'js': case 'jsx': return 'javascript'
      case 'ts': case 'tsx': return 'typescript'
      case 'py': return 'python'
      case 'css': return 'css'
      case 'json': return 'json'
      case 'xml': return 'xml'
      case 'yaml': case 'yml': return 'yaml'
      default: return 'text'
    }
  }

  const generatePreview = async (content: string, lang: string) => {
    setIsLoading(true)
    try {
      switch (lang) {
        case 'markdown':
          setPreviewContent(content)
          break
        case 'html':
          setPreviewContent(content)
          break
        case 'javascript':
        case 'typescript':
          // For JS/TS, we could show a formatted version or execution results
          setPreviewContent(content)
          break
        case 'json':
          try {
            const formatted = JSON.stringify(JSON.parse(content), null, 2)
            setPreviewContent(formatted)
          } catch {
            setPreviewContent(content)
          }
          break
        default:
          setPreviewContent(content)
      }
    } catch (error) {
      console.error('Preview generation error:', error)
      setPreviewContent(content)
      toast.error('Failed to generate preview')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    generatePreview(displayContent, displayLanguage)
    toast.success('Preview refreshed')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewContent)
      toast.success('Content copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy content')
    }
  }

  const handleExport = () => {
    const blob = new Blob([previewContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `preview-${Date.now()}.${displayLanguage === 'markdown' ? 'md' : 'txt'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Preview exported')
  }

  const renderPreviewContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
          <span className="ml-2 text-gray-400">Generating preview...</span>
        </div>
      )
    }

    switch (displayLanguage) {
      case 'markdown':
        return (
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={theme === 'dark' ? oneDark : undefined}
                      language={match[1]}
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
              {previewContent}
            </ReactMarkdown>
          </div>
        )
      case 'html':
        return (
          <iframe
            srcDoc={previewContent}
            className="w-full h-full border-0 bg-white"
            title="HTML Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        )
      case 'json':
        return (
          <SyntaxHighlighter
            language="json"
            style={theme === 'dark' ? oneDark : undefined}
            className="h-full"
            customStyle={{ 
              background: 'transparent',
              fontSize: '14px',
            }}
          >
            {previewContent}
          </SyntaxHighlighter>
        )
      default:
        return (
          <SyntaxHighlighter
            language={displayLanguage}
            style={theme === 'dark' ? oneDark : undefined}
            className="h-full"
            customStyle={{ 
              background: 'transparent',
              fontSize: '14px',
            }}
          >
            {previewContent}
          </SyntaxHighlighter>
        )
    }
  }

  if (previewMode === 'hidden') {
    return null
  }

  return (
    <div className={`bg-gray-800 border-l border-gray-700 flex flex-col ${
      previewMode === 'preview-only' ? 'w-full' : 'w-1/2'
    }`}>
      {/* Preview Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Preview</span>
          {filePath && (
            <span className="text-xs text-gray-400">
              {filePath.split('/').pop()}
            </span>
          )}
          <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
            {displayLanguage}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleRefresh}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Refresh Preview"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Copy Content"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={handleExport}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Export Preview"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.open('', '_blank')}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Open in New Tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-gray-600 mx-1" />

          <button
            onClick={() => setPreviewMode(prev => 
              prev === 'split' ? 'preview-only' : 'split'
            )}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title={previewMode === 'split' ? 'Preview Only' : 'Split View'}
          >
            {previewMode === 'split' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto bg-gray-900 p-4">
        {displayContent ? (
          renderPreviewContent()
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <div className="text-center">
              <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No Content to Preview</p>
              <p className="text-sm">Open a file or select content to see a preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Preview