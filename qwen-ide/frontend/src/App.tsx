import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import MainLayout from './components/Layout/MainLayout'
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
  const { theme } = useAppStore()
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className={`${theme === 'dark' ? 'dark' : ''} min-h-screen bg-gray-50 dark:bg-gray-900`}>
          <MainLayout />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'dark:bg-gray-800 dark:text-white',
            }}
          />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App