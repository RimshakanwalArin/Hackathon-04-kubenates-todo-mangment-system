import { useEffect, useState } from 'react'
import { ChatProvider, useChat } from './context/ChatContext'
import ChatInterface from './components/ChatInterface'
import { createAPIClient } from './services/api-client'
import './styles/index.css'

const AppContent = () => {
  const { setIsConnected, apiBaseUrl } = useChat()
  const [isInitializing, setIsInitializing] = useState(false) // Skip initialization
  const [apiClient, setApiClient] = useState(null)

  useEffect(() => {
    // Create API client immediately
    const client = createAPIClient(apiBaseUrl)
    setApiClient(client)
    setIsInitializing(false)
  }, [apiBaseUrl, setIsConnected])

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4 mx-auto"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-screen bg-gray-50 p-2 sm:p-4">
      <div className="w-full max-w-2xl h-[100dvh] sm:h-[600px] flex flex-col">
        {apiClient ? (
          <ChatInterface apiClient={apiClient} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  )
}
