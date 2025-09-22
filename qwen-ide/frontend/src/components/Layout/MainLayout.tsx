import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import Header from './Header'
import Sidebar from './Sidebar'
import MainEditor from '../Editor/MainEditor'
import SimpleChatPanel from '../Chat/SimpleChatPanel'
import TerminalPanel from '../Terminal/TerminalPanel'
import SettingsPanel from '../Settings/SettingsPanel'
import DistributedIntelligencePanel from '../AI/DistributedIntelligencePanel'
import CodeDIPanel from '../CodeDI/CodeDIPanel'
import ZipManager from '../Archive/ZipManager'
import InstallerWizard from '../Archive/InstallerWizard'
import Preview from '../Preview/Preview'
import { useAppStore } from '../../stores/appStore'

const MainLayout = () => {
  const { 
    activePanel,
    activeFile 
  } = useAppStore()

  // Auto-show preview for certain file types
  const shouldShowPreview = activeFile && (
    activeFile.endsWith('.md') || 
    activeFile.endsWith('.html') || 
    activeFile.endsWith('.json')
  )

  const renderBottomPanel = () => {
    switch (activePanel) {
      case 'chat':
        return <SimpleChatPanel />
      case 'terminal':
        return <TerminalPanel />
      case 'settings':
        return <SettingsPanel />
      case 'ai':
        return <DistributedIntelligencePanel />
      case 'codedi':
        return <CodeDIPanel />
      default:
        return null
    }
  }

  return (
    <div className="h-screen flex flex-col bg-black text-yellow-400">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Panels */}
        <PanelGroup direction="horizontal">
          {/* Sidebar */}
          <Panel defaultSize={20} minSize={15} maxSize={40}>
            <div className="h-full bg-gray-800 border-r border-gray-700">
              <Sidebar />
            </div>
          </Panel>
          
          <PanelResizeHandle className="w-2 bg-gray-700 hover:bg-blue-500 transition-colors" />
          
          {/* Main Content Area */}
          <Panel defaultSize={80}>
            <PanelGroup direction="vertical">
              {/* Editor Area */}
              <Panel defaultSize={70} minSize={30}>
                <div className="flex-1 overflow-hidden flex">
                  <div className={`${shouldShowPreview ? 'w-1/2' : 'w-full'} transition-all duration-200`}>
                    <MainEditor />
                  </div>
                  {shouldShowPreview && (
                    <Preview filePath={activeFile || undefined} />
                  )}
                </div>
              </Panel>
              
              {/* Bottom Panel */}
              {activePanel !== 'files' && (
                <>
                  <PanelResizeHandle className="h-2 bg-gray-700 hover:bg-blue-500 transition-colors" />
                  <Panel defaultSize={30} minSize={20} maxSize={50}>
                    <div className="h-full bg-gray-800 border-t border-gray-700">
                      {renderBottomPanel()}
                    </div>
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}

export default MainLayout