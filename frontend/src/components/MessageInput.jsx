import { useState, useRef, useEffect } from 'react'

const MessageInput = ({ onSend, isLoading = false, isDisabled = false }) => {
  const [message, setMessage] = useState('')
  const textareaRef = useRef(null)

  const handleSend = () => {
    if (message.trim() && !isLoading && !isDisabled) {
      onSend(message.trim())
      setMessage('')
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e) => {
    const value = e.target.value
    if (value.length <= 500) {
      setMessage(value)
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  return (
    <div className="message-input-container">
      <div className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder={isDisabled ? "Backend unavailable..." : "Type your message... (Enter to send, Shift+Enter for new line)"}
          disabled={isLoading || isDisabled}
          className="message-input"
          rows="1"
          maxLength="500"
          aria-label="Message input"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading || isDisabled}
          className="send-button"
          aria-label="Send message"
        >
          {isLoading ? (
            <span className="animate-spin">⟳</span>
          ) : (
            '→'
          )}
        </button>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {message.length}/500
      </div>
    </div>
  )
}

export default MessageInput
