export const errorCodeMap = {
  'TIMEOUT': 'Server took too long to respond. Please try again.',
  'CONNECTION_ERROR': 'Unable to reach server. Please check your connection.',
  'INVALID_JSON': 'Received invalid response from server.',
  'UNKNOWN_ERROR': 'An unexpected error occurred.',
  'FAILED': 'Operation failed. Please try again.',
  'UNKNOWN': 'Could not understand the request.',
  400: 'Bad request. Please check your input.',
  401: 'Unauthorized. Please log in.',
  403: 'Access forbidden.',
  404: 'Resource not found.',
  500: 'Server error. Please try again later.',
  503: 'Server is temporarily unavailable.'
}

export const getErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred'

  // Check if it's an APIError with a code
  if (error.code) {
    return errorCodeMap[error.code] || error.message || 'An error occurred'
  }

  // Check if it's a response error with a status code
  if (error.data && error.data.error) {
    return error.data.error
  }

  // Check if it's an HTTP status code
  if (typeof error === 'number') {
    return errorCodeMap[error] || `HTTP Error ${error}`
  }

  // Otherwise return the message
  return error.message || 'An error occurred'
}

export const formatErrorForDisplay = (error) => {
  const message = getErrorMessage(error)
  return {
    message,
    canRetry: true,
    showDetails: false
  }
}

export const handleChatError = (error) => {
  const userMessage = getErrorMessage(error)

  if (error.code === 'TIMEOUT') {
    return {
      text: `⏱️ ${userMessage}`,
      type: 'error'
    }
  }

  if (error.code === 'CONNECTION_ERROR') {
    return {
      text: `🔌 ${userMessage}`,
      type: 'error'
    }
  }

  return {
    text: `❌ ${userMessage}`,
    type: 'error'
  }
}

export default {
  errorCodeMap,
  getErrorMessage,
  formatErrorForDisplay,
  handleChatError
}
