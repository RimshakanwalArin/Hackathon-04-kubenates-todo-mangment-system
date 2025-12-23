const WelcomeMessage = () => {
  return (
    <div className="welcome-message">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">📝 Todo Chatbot</h1>
        <p className="text-gray-600 mb-6">Welcome! Start chatting to manage your todos.</p>
        <div className="space-y-2 text-left max-w-sm mx-auto text-sm text-gray-600">
          <p className="font-semibold text-gray-700">Try commands like:</p>
          <ul className="space-y-1">
            <li>• "add Buy groceries"</li>
            <li>• "show todos"</li>
            <li>• "mark Buy groceries done"</li>
            <li>• "delete Buy groceries"</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default WelcomeMessage
