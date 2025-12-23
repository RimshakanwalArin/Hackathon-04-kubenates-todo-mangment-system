const LoadingIndicator = () => {
  return (
    <div className="loading-indicator">
      <span className="text-sm">Bot is typing</span>
      <div className="loading-dots">
        <div className="loading-dot animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="loading-dot animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="loading-dot animate-bounce" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  )
}

export default LoadingIndicator
