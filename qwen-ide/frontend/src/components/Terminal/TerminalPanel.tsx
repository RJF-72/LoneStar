import { useState, useRef, useEffect } from 'react'
import { Terminal, X } from 'lucide-react'

interface TerminalOutput {
  id: string
  command: string
  output: string
  timestamp: Date
  isError?: boolean
}

const TerminalPanel = () => {
  const [currentCommand, setCurrentCommand] = useState('')
  const [history, setHistory] = useState<TerminalOutput[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [history])

  useEffect(() => {
    // Focus input when panel is shown
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const executeCommand = async () => {
    if (!currentCommand.trim() || isExecuting) return

    const command = currentCommand.trim()
    setCurrentCommand('')
    setIsExecuting(true)

    // Add to command history
    setCommandHistory(prev => [...prev.filter(cmd => cmd !== command), command])
    setHistoryIndex(-1)

    try {
      // For now, simulate terminal execution
      // In a full implementation, this would connect to a backend terminal service
      let output = ''
      let isError = false

      // Handle some basic commands locally
      switch (command.toLowerCase()) {
        case 'clear':
          setHistory([])
          setIsExecuting(false)
          return
        
        case 'help':
          output = `Available commands:
• help - Show this help
• clear - Clear terminal
• ls - List files (simulated)
• pwd - Show current directory
• echo [text] - Echo text
• node --version - Show Node.js version
• npm --version - Show npm version
• Other commands will be executed on the server (when implemented)`
          break
        
        case 'ls':
          output = `src/
components/
package.json
README.md
tsconfig.json`
          break
        
        case 'pwd':
          output = `/workspace/lonestar-ide`
          break
        
        case 'node --version':
          output = 'v18.17.0'
          break
        
        case 'npm --version':
          output = '9.6.7'
          break
        
        default:
          if (command.startsWith('echo ')) {
            output = command.slice(5)
          } else {
            // Simulate command execution
            await new Promise(resolve => setTimeout(resolve, 500))
            output = `Command '${command}' executed (simulated)`
          }
      }

      const terminalOutput: TerminalOutput = {
        id: Date.now().toString(),
        command,
        output,
        timestamp: new Date(),
        isError
      }

      setHistory(prev => [...prev, terminalOutput])
    } catch (error) {
      const terminalOutput: TerminalOutput = {
        id: Date.now().toString(),
        command,
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        isError: true
      }

      setHistory(prev => [...prev, terminalOutput])
    } finally {
      setIsExecuting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1)
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex] || '')
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex] || '')
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setCurrentCommand('')
      }
    }
  }

  const clearTerminal = () => {
    setHistory([])
  }

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col">
      {/* Terminal Header */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <span className="font-medium">Terminal</span>
        </div>
        <button
          onClick={clearTerminal}
          className="text-gray-400 hover:text-white p-1"
          title="Clear terminal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Terminal Content */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm"
      >
        {/* Welcome message */}
        {history.length === 0 && (
          <div className="text-gray-400 mb-4">
            <p>LoneStar IDE Terminal</p>
            <p>Type 'help' for available commands</p>
            <br />
          </div>
        )}

        {/* Command history */}
        {history.map((entry) => (
          <div key={entry.id} className="mb-3">
            <div className="flex items-center text-green-400 mb-1">
              <span className="text-blue-400">user@lonestar</span>
              <span className="text-white">:</span>
              <span className="text-blue-400">~/workspace</span>
              <span className="text-white">$ </span>
              <span className="text-white">{entry.command}</span>
            </div>
            {entry.output && (
              <div className={`whitespace-pre-wrap ${entry.isError ? 'text-red-400' : 'text-gray-300'}`}>
                {entry.output}
              </div>
            )}
          </div>
        ))}

        {/* Current command line */}
        <div className="flex items-center text-green-400">
          <span className="text-blue-400">user@lonestar</span>
          <span className="text-white">:</span>
          <span className="text-blue-400">~/workspace</span>
          <span className="text-white">$ </span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-white"
            placeholder={isExecuting ? "Executing..." : "Type a command..."}
            disabled={isExecuting}
          />
          {isExecuting && (
            <div className="ml-2">
              <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-gray-800 px-4 py-1 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex justify-between items-center">
          <span>Ready</span>
          <span>{history.length} commands executed</span>
        </div>
      </div>
    </div>
  )
}

export default TerminalPanel