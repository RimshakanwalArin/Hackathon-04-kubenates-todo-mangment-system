const UserMessage = ({ text, timestamp }) => {
  const formatTime = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="message-content user-message">
      <p className="text-sm">{text}</p>
      {timestamp && (
        <p className="text-xs mt-1 opacity-75">{formatTime(timestamp)}</p>
      )}
    </div>
  )
}

export default UserMessage
