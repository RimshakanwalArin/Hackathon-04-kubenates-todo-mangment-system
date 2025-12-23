import { useEffect, useState } from 'react'
import { ChatProvider, useChat } from './context/ChatContext'
import ChatInterface from './components/ChatInterface'
import { createAPIClient } from './services/api-client'
import { checkBackendHealth } from './services/health-check'
import './styles/index.css'

const AppContent = () => {
  const { setIsConnected, apiBaseUrl } = useChat()
  const [isInitializing, setIsInitializing] = useState(true)
  const [apiClient, setApiClient] = useState(null)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Create API client
        const client = createAPIClient(apiBaseUrl)
        setApiClient(client)

        // Check backend health
        const health = await checkBackendHealth(client)
        setIsConnected(health.isHealthy)

        if (!health.isHealthy) {
          console.warn('Backend health check failed:', health.error)
        }
      } catch (error) {
        console.error('Failed to initialize app:', error)
        setIsConnected(false)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeApp()
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
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-2xl h-screen max-h-screen md:h-[600px] md:max-h-[600px]">
        {apiClient ? (
          <ChatInterface apiClient={apiClient} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-600 font-semibold mb-4">Unable to connect to backend</p>
              <p className="text-gray-600">Please ensure the backend is running at {apiBaseUrl}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
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
