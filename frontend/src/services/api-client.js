const DEFAULT_TIMEOUT = 5000

class APIClient {
  constructor(baseUrl, timeout = DEFAULT_TIMEOUT) {
    this.baseUrl = baseUrl
    this.timeout = timeout
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new APIError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          errorData
        )
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof APIError) {
        throw error
      }

      if (error.name === 'AbortError') {
        throw new APIError('Request timeout', 'TIMEOUT')
      }

      if (error instanceof SyntaxError) {
        throw new APIError('Invalid JSON response', 'INVALID_JSON')
      }

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new APIError('Failed to connect to server', 'CONNECTION_ERROR')
      }

      throw new APIError(error.message || 'Unknown error', 'UNKNOWN_ERROR')
    }
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' })
  }

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    })
  }

  async put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body)
    })
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' })
  }
}

export class APIError extends Error {
  constructor(message, code, data = {}) {
    super(message)
    this.name = 'APIError'
    this.code = code
    this.data = data
  }
}

export const createAPIClient = (baseUrl, timeout = DEFAULT_TIMEOUT) => {
  return new APIClient(baseUrl, timeout)
}

export default APIClient
