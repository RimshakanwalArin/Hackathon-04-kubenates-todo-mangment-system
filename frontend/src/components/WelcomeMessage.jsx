const WelcomeMessage = () => {
  const commands = [
    { emoji: '➕', text: 'add Buy groceries' },
    { emoji: '📋', text: 'show todos' },
    { emoji: '✅', text: 'mark Buy groceries done' },
    { emoji: '🗑️', text: 'delete Buy groceries' }
  ]

  return (
    <div className="welcome-message">
      <div className="welcome-icon">🤖</div>
      <h1 className="welcome-title">Todo Chatbot</h1>
      <p className="welcome-subtitle">Start chatting to manage your todos effortlessly</p>

      <div className="welcome-examples">
        {commands.map((cmd, idx) => (
          <div key={idx} className="example-command">
            <span className="text-lg mr-2">{cmd.emoji}</span>
            <code>{cmd.text}</code>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-8">
        💡 Tip: Use natural language or commands to interact
      </p>
    </div>
  )
}

export default WelcomeMessage
