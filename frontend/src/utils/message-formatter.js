export const formatBotResponse = (response) => {
  if (!response) return ''

  if (typeof response === 'string') {
    return response
  }

  if (response.error) {
    return response.error
  }

  if (response.result) {
    if (typeof response.result === 'string') {
      return response.result
    }

    if (response.result.title) {
      return `✓ Todo: ${response.result.title}`
    }

    if (Array.isArray(response.result)) {
      return response.result
    }

    return JSON.stringify(response.result)
  }

  return JSON.stringify(response)
}

export const formatTodoList = (todos) => {
  if (!Array.isArray(todos) || todos.length === 0) {
    return 'No todos yet.'
  }

  const todoItems = todos
    .map((todo, index) => {
      const status = todo.completed ? '✓' : '○'
      const title = todo.title || 'Untitled'
      const id = todo.id ? `\n   ID: ${todo.id}` : ''
      return `${status} ${index + 1}. ${title}${id}`
    })
    .join('\n')

  return `📋 Your todos:\n${todoItems}`
}

export const parseChatResponse = (response) => {
  if (!response) return null

  const formatted = {
    intent: response.intent || 'UNKNOWN',
    status: response.status || 'UNKNOWN',
    text: '',
    todos: null,
    error: null
  }

  if (response.status === 'FAILED' || response.error) {
    formatted.error = response.error || 'Operation failed'
    formatted.text = `❌ ${formatted.error}`
    return formatted
  }

  if (response.result) {
    if (Array.isArray(response.result)) {
      formatted.todos = response.result
      formatted.text = formatTodoList(response.result)
    } else if (response.result.title) {
      const idText = response.result.id ? `\nID: ${response.result.id}` : ''
      formatted.text = `✓ Added: "${response.result.title}"${idText}`
    } else if (response.result.completed !== undefined) {
      formatted.text = `✓ Updated successfully`
    } else {
      formatted.text = formatBotResponse(response.result)
    }
  } else {
    formatted.text = formatBotResponse(response)
  }

  return formatted
}

export const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, char => map[char])
}

export default {
  formatBotResponse,
  formatTodoList,
  parseChatResponse,
  escapeHtml
}
