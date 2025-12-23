import { createContext, useContext, useState, useCallback } from 'react'

const ChatContext = createContext(null)

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([])
  const [isConnected, setIsConnected] = useState(true)
  const [lastError, setLastError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

  const addMessage = useCallback((sender, text, isLoadingMessage = false) => {
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}-${Math.random()}`,
      sender,
      text,
      timestamp: new Date().toISOString(),
      isLoading: isLoadingMessage
    }])
  }, [])

  const updateLastMessage = useCallback((updates) => {
    setMessages(prev => {
      const newMessages = [...prev]
      if (newMessages.length > 0) {
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          ...updates
        }
      }
      return newMessages
    })
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  const setError = useCallback((error) => {
    setLastError(error)
  }, [])

  const clearError = useCallback(() => {
    setLastError(null)
  }, [])

  const value = {
    messages,
    isConnected,
    setIsConnected,
    lastError,
    setError,
    clearError,
    addMessage,
    updateLastMessage,
    clearMessages,
    isLoading,
    setIsLoading,
    apiBaseUrl
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
