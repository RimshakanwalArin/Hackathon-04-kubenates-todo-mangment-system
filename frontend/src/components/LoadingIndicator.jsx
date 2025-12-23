const LoadingIndicator = () => {
  return (
    <div className="loading-indicator">
      <span className="loading-text">💭 Thinking</span>
      <div className="loading-dots">
        <div className="loading-dot"></div>
        <div className="loading-dot"></div>
        <div className="loading-dot"></div>
      </div>
    </div>
  )
}

export default LoadingIndicator
