import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProjectSettings, Project, QwenConversation, QwenModelConfig } from '../../../shared/types'

interface AppState {
  // UI State
  theme: 'light' | 'dark' | 'auto'
  sidebarWidth: number
  panelHeight: number
  activePanel: 'files' | 'chat' | 'terminal' | 'settings'
  
  // Project State
  currentProject: Project | null
  projects: Project[]
  
  // Editor State
  activeFile: string | null
  openFiles: string[]
  fileContents: Record<string, string>
  
  // AI/Chat State
  conversations: QwenConversation[]
  activeConversation: string | null
  modelConfig: QwenModelConfig
  isModelLoading: boolean
  modelStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
  
  // Settings
  settings: ProjectSettings
}

interface AppActions {
  // UI Actions
  setTheme: (theme: 'light' | 'dark' | 'auto') => void
  setSidebarWidth: (width: number) => void
  setPanelHeight: (height: number) => void
  setActivePanel: (panel: 'files' | 'chat' | 'terminal' | 'settings') => void
  
  // Project Actions
  setCurrentProject: (project: Project | null) => void
  addProject: (project: Project) => void
  updateProject: (projectId: string, updates: Partial<Project>) => void
  removeProject: (projectId: string) => void
  
  // Editor Actions
  setActiveFile: (filePath: string | null) => void
  openFile: (filePath: string) => void
  closeFile: (filePath: string) => void
  updateFileContent: (filePath: string, content: string) => void
  
  // AI/Chat Actions
  addConversation: (conversation: QwenConversation) => void
  updateConversation: (conversationId: string, updates: Partial<QwenConversation>) => void
  removeConversation: (conversationId: string) => void
  setActiveConversation: (conversationId: string | null) => void
  updateModelConfig: (config: Partial<QwenModelConfig>) => void
  setModelLoading: (loading: boolean) => void
  setModelStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void
  
  // Settings Actions
  updateSettings: (settings: Partial<ProjectSettings>) => void
}

const defaultSettings: ProjectSettings = {
  aiAssistance: true,
  autoComplete: true,
  syntaxHighlighting: true,
  theme: 'dark',
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
}

const defaultModelConfig: QwenModelConfig = {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
  topK: 50,
  repeatPenalty: 1.1,
  systemPrompt: 'You are a helpful AI assistant specialized in software development. Provide clear, concise, and practical coding assistance.',
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      // Initial State
      theme: 'dark',
      sidebarWidth: 300,
      panelHeight: 400,
      activePanel: 'files',
      
      currentProject: null,
      projects: [],
      
      activeFile: null,
      openFiles: [],
      fileContents: {},
      
      conversations: [],
      activeConversation: null,
      modelConfig: defaultModelConfig,
      isModelLoading: false,
      modelStatus: 'disconnected',
      
      settings: defaultSettings,
      
      // UI Actions
      setTheme: (theme) => set({ theme }),
      setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
      setPanelHeight: (panelHeight) => set({ panelHeight }),
      setActivePanel: (activePanel) => set({ activePanel }),
      
      // Project Actions
      setCurrentProject: (currentProject) => set({ currentProject }),
      addProject: (project) => set((state) => ({ 
        projects: [...state.projects, project] 
      })),
      updateProject: (projectId, updates) => set((state) => ({
        projects: state.projects.map(p => p.id === projectId ? { ...p, ...updates } : p),
        currentProject: state.currentProject?.id === projectId 
          ? { ...state.currentProject, ...updates } 
          : state.currentProject
      })),
      removeProject: (projectId) => set((state) => ({
        projects: state.projects.filter(p => p.id !== projectId),
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject
      })),
      
      // Editor Actions
      setActiveFile: (activeFile) => set({ activeFile }),
      openFile: (filePath) => set((state) => ({
        openFiles: state.openFiles.includes(filePath) ? state.openFiles : [...state.openFiles, filePath],
        activeFile: filePath
      })),
      closeFile: (filePath) => set((state) => {
        const newOpenFiles = state.openFiles.filter(f => f !== filePath)
        return {
          openFiles: newOpenFiles,
          activeFile: state.activeFile === filePath 
            ? (newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null)
            : state.activeFile
        }
      }),
      updateFileContent: (filePath, content) => set((state) => ({
        fileContents: { ...state.fileContents, [filePath]: content }
      })),
      
      // AI/Chat Actions
      addConversation: (conversation) => set((state) => ({
        conversations: [...state.conversations, conversation]
      })),
      updateConversation: (conversationId, updates) => set((state) => ({
        conversations: state.conversations.map(c => 
          c.id === conversationId ? { ...c, ...updates } : c
        )
      })),
      removeConversation: (conversationId) => set((state) => ({
        conversations: state.conversations.filter(c => c.id !== conversationId),
        activeConversation: state.activeConversation === conversationId ? null : state.activeConversation
      })),
      setActiveConversation: (activeConversation) => set({ activeConversation }),
      updateModelConfig: (config) => set((state) => ({
        modelConfig: { ...state.modelConfig, ...config }
      })),
      setModelLoading: (isModelLoading) => set({ isModelLoading }),
      setModelStatus: (modelStatus) => set({ modelStatus }),
      
      // Settings Actions
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),
    }),
    {
      name: 'lonestar-ide-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarWidth: state.sidebarWidth,
        panelHeight: state.panelHeight,
        settings: state.settings,
        modelConfig: state.modelConfig,
        projects: state.projects,
        conversations: state.conversations,
      }),
    }
  )
)