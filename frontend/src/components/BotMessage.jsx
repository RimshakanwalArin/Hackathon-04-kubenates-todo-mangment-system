import LoadingIndicator from './LoadingIndicator'
import TodoList from './TodoList'

const BotMessage = ({ text, isLoading = false, todos = null }) => {
  // Check if text is a todo list format
  const isTodoListText = text && typeof text === 'string' && text.includes('📋')

  return (
    <div className="message-content bot-message">
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
  )
}

export default BotMessage
