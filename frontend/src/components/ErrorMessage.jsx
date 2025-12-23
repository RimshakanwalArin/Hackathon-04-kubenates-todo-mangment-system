const ErrorMessage = ({ message, onRetry, onDismiss }) => {
  return (
    <div className="error-message mx-4 mb-4" role="alert">
      <span className="error-icon">⚠️</span>
      <div className="error-content flex-1">
        <p className="error-title">Something went wrong</p>
        <p className="error-text">{message}</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
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
            className="dismiss-button"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

export default ErrorMessage
