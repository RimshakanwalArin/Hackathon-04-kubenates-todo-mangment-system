const TodoList = ({ todos = [] }) => {
  if (!Array.isArray(todos) || todos.length === 0) {
    return <p className="text-sm">No todos yet.</p>
  }

  return (
    <div className="space-y-2">
      <p className="font-semibold text-sm mb-2">📋 Your todos:</p>
      <ul className="space-y-1">
        {todos.map((todo, index) => (
          <li key={todo.id || index} className="text-sm flex items-start gap-2">
            <span className="flex-shrink-0">
              {todo.completed ? '✓' : '○'}
            </span>
            <span className={todo.completed ? 'line-through opacity-60' : ''}>
              {todo.title || 'Untitled'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TodoList
