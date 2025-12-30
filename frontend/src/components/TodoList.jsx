const TodoList = ({ todos = [] }) => {
  if (!Array.isArray(todos) || todos.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-400 text-sm">📭 No todos yet</p>
        <p className="text-xs text-gray-300 mt-1">Start by adding one!</p>
      </div>
    )
  }

  const completedCount = todos.filter(t => t.completed).length

  return (
    <div className="todo-list space-y-0">
      <div className="mb-4 pb-3 border-b border-gray-200">
        <p className="font-semibold text-sm text-gray-700">📋 Your todos</p>
        <p className="text-xs text-gray-500 mt-1">
          {completedCount}/{todos.length} completed
        </p>
      </div>

      {todos.map((todo, index) => (
        <div
          key={todo.id || index}
          className={`todo-item ${todo.completed ? 'completed' : ''}`}
        >
          <div
            className={`todo-checkbox ${todo.completed ? 'checked' : ''}`}
            title={todo.completed ? 'Completed' : 'Pending'}
          >
            {todo.completed && <span className="text-white text-sm">✓</span>}
          </div>
          <div className="flex-1">
            <div>
              <span className={`todo-text ${todo.completed ? 'completed' : ''}`}>
                {todo.title || 'Untitled'}
              </span>
              {todo.completed && <span className="text-xs text-green-500 ml-2">Done</span>}
            </div>
            {todo.id && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono text-gray-700 break-all">
                {todo.id}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default TodoList
