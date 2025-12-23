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
    <div className="flex gap-3 flex-row-reverse">
      <div className="message-avatar user">👤</div>
      <div>
        <div className="message-bubble user-message">
          <p className="text-sm">{text}</p>
          {timestamp && (
            <p className="message-timestamp text-white/70">{formatTime(timestamp)}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserMessage
