import { useState, useRef, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { useAppStore } from '../../stores/appStore'

const MainEditor = () => {
  const { 
    activeFile, 
    openFiles, 
    fileContents, 
    updateFileContent, 
    closeFile,
    settings 
  } = useAppStore()
  
  const editorRef = useRef<any>(null)

  const handleEditorDidMount = useCallback((editor: any) => {
    editorRef.current = editor
    
    // Configure editor options
    editor.updateOptions({
      fontSize: settings.fontSize,
      tabSize: settings.tabSize,
      wordWrap: settings.wordWrap ? 'on' : 'off',
      theme: settings.theme === 'dark' ? 'vs-dark' : 'vs-light',
    })
  }, [settings])

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (activeFile && value !== undefined) {
      updateFileContent(activeFile, value)
    }
  }, [activeFile, updateFileContent])

  const getLanguageFromFilename = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript'
      case 'js':
      case 'jsx':
        return 'javascript'
      case 'py':
        return 'python'
      case 'rs':
        return 'rust'
      case 'go':
        return 'go'
      case 'cpp':
      case 'cc':
      case 'cxx':
        return 'cpp'
      case 'c':
        return 'c'
      case 'java':
        return 'java'
      case 'php':
        return 'php'
      case 'rb':
        return 'ruby'
      case 'swift':
        return 'swift'
      case 'kt':
        return 'kotlin'
      case 'scala':
        return 'scala'
      case 'sh':
        return 'shell'
      case 'sql':
        return 'sql'
      case 'json':
        return 'json'
      case 'yaml':
      case 'yml':
        return 'yaml'
      case 'xml':
        return 'xml'
      case 'html':
        return 'html'
      case 'css':
        return 'css'
      case 'scss':
        return 'scss'
      case 'md':
        return 'markdown'
      default:
        return 'plaintext'
    }
  }

  if (!activeFile) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 text-gray-400">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Welcome to LoneStar IDE</h3>
          <p className="text-sm">Select a file to start editing</p>
          <div className="mt-4 text-xs text-gray-500">
            <p>• AI-powered code completion with Qwen3:4B</p>
            <p>• Intelligent code analysis and suggestions</p>
            <p>• Real-time preview and collaboration</p>
          </div>
        </div>
      </div>
    )
  }

  const language = getLanguageFromFilename(activeFile)
  const content = fileContents[activeFile] || ''

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Tab Bar */}
      {openFiles.length > 0 && (
        <div className="flex bg-gray-800 border-b border-gray-700 overflow-x-auto scrollbar">
          {openFiles.map((filePath) => {
            const fileName = filePath.split('/').pop() || filePath
            const isActive = activeFile === filePath
            
            return (
              <div
                key={filePath}
                className={`flex items-center px-4 py-2 text-sm border-r border-gray-700 cursor-pointer whitespace-nowrap ${
                  isActive 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                onClick={() => useAppStore.getState().setActiveFile(filePath)}
              >
                <span>{fileName}</span>
                <button
                  className="ml-2 hover:bg-gray-600 rounded p-0.5 text-gray-400 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    closeFile(filePath)
                  }}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={language}
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme={settings.theme === 'dark' ? 'vs-dark' : 'vs-light'}
          options={{
            fontSize: settings.fontSize,
            tabSize: settings.tabSize,
            wordWrap: settings.wordWrap ? 'on' : 'off',
            minimap: { enabled: true },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderWhitespace: 'selection',
            rulers: [80, 120],
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              highlightActiveIndentation: true,
            },
          }}
        />
      </div>
    </div>
  )
}

export default MainEditor