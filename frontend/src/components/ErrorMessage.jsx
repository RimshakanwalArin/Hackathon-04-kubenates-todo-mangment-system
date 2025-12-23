const ErrorMessage = ({ message, onRetry, onDismiss }) => {
  return (
    <div className="error-message mx-4 mb-4" role="alert">
      <span className="error-icon">❌</span>
      <div className="flex-1">
        <p className="text-sm font-semibold">{message}</p>
      </div>
      <div className="flex gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="retry-button"
            aria-label="Retry sending message"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

export default ErrorMessage
