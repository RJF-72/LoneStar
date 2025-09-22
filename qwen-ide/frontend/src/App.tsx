import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import DICentricLayout from './components/Layout/DICentricLayout'
import { WelcomeScreen } from './components/Layout/WelcomeScreen'
import { useAppStore } from './stores/appStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

function App() {
  const { currentProject } = useAppStore()

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="App h-screen bg-black text-white">
          {currentProject ? <DICentricLayout /> : <WelcomeScreen />}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1f2937',
                color: '#f3f4f6',
                border: '1px solid #f97316',
              },
            }}
          />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App