import { useEffect, useRef } from 'react'
import UserMessage from './UserMessage'
import BotMessage from './BotMessage'

const MessageList = ({ messages = [] }) => {
  const endRef = useRef(null)
  const containerRef = useRef(null)

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div
      ref={containerRef}
      className="message-list scrollbar-hidden"
      role="log"
      aria-live="polite"
    >
      {messages.map((message) => (
        <div key={message.id} className="animate-slide-up">
          {message.sender === 'user' ? (
            <UserMessage text={message.text} timestamp={message.timestamp} />
          ) : (
            <BotMessage text={message.text} isLoading={message.isLoading} />
          )}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  )
}

export default MessageList
