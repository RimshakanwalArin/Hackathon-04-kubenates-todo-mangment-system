import { useState } from 'react'
import { useChat } from '../context/ChatContext'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import ErrorMessage from './ErrorMessage'
import WelcomeMessage from './WelcomeMessage'
import { parseChatResponse } from '../utils/message-formatter'
import { getErrorMessage, handleChatError } from '../utils/error-handlers'

const ChatInterface = ({ apiClient }) => {
  const { messages, isLoading, setIsLoading, addMessage, lastError, setError, clearError, isConnected } = useChat()
  const [retryMessage, setRetryMessage] = useState(null)

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim() || !isConnected) return

    try {
      clearError()
      addMessage('user', messageText.trim())
      setIsLoading(true)
      setRetryMessage(null)

      const response = await apiClient.post('/api/v1/chat', {
        message: messageText.trim()
      })

      const parsedResponse = parseChatResponse(response)

      if (response.status === 'FAILED' || response.error) {
        const errorMsg = response.error || 'Operation failed'
        setError({ message: errorMsg, code: 'FAILED' })
        addMessage('bot', `❌ ${errorMsg}`)
        setRetryMessage(messageText.trim())
      } else {
        addMessage('bot', parsedResponse.text, false)
      }
    } catch (error) {
      const errorDisplay = handleChatError(error)
      setError(error)
      addMessage('bot', errorDisplay.text)
      setRetryMessage(messageText.trim())
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    if (retryMessage) {
      handleSendMessage(retryMessage)
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-title">
          <span className="chat-title-emoji">🤖</span>
          <span>Todo Chatbot</span>
        </div>
      </div>

      {messages.length === 0 && !isConnected && (
        <WelcomeMessage />
      )}

      {messages.length === 0 && isConnected && (
        <div className="flex-1 flex items-center justify-center">
          <WelcomeMessage />
        </div>
      )}

      {messages.length > 0 && (
        <>
          <MessageList messages={messages} />
          {lastError && (
            <ErrorMessage
              message={lastError.message || getErrorMessage(lastError)}
              onRetry={handleRetry}
            />
          )}
        </>
      )}

      {!isConnected && messages.length > 0 && (
        <div className="error-message mx-4 mb-4">
          <span className="error-icon">🔌</span>
          <div className="error-content">
            <p className="error-title">Backend Unavailable</p>
            <p className="error-text">Cannot send messages. Please check your connection.</p>
          </div>
        </div>
      )}

      <MessageInput
        onSend={handleSendMessage}
        isLoading={isLoading}
        isDisabled={!isConnected}
      />
    </div>
  )
}

export default ChatInterface
