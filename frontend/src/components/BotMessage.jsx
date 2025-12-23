import LoadingIndicator from './LoadingIndicator'
import TodoList from './TodoList'

const BotMessage = ({ text, isLoading = false, todos = null }) => {
  // Check if text is a todo list format
  const isTodoListText = text && typeof text === 'string' && text.includes('📋')

  return (
    <div className="flex gap-3">
      <div className="message-avatar bot">🤖</div>
      <div>
        <div className="message-bubble bot-message">
          {isLoading ? (
            <LoadingIndicator />
          ) : (
            <>
              {isTodoListText && todos ? (
                <TodoList todos={todos} />
              ) : (
                <p className="text-sm whitespace-pre-wrap break-words">{text}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default BotMessage
