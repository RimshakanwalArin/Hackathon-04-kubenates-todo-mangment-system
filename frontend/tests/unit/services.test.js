import APIClient, { APIError, createAPIClient } from '../../src/services/api-client'
import { checkBackendHealth, waitForBackendReady } from '../../src/services/health-check'
import { getErrorMessage, handleChatError } from '../../src/utils/error-handlers'
import { formatBotResponse, parseChatResponse } from '../../src/utils/message-formatter'

describe('API Client', () => {
  let mockFetch
  let client

  beforeEach(() => {
    mockFetch = jest.fn()
    global.fetch = mockFetch
    client = new APIClient('http://localhost:3001', 5000)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('creates API client with default timeout', () => {
    const testClient = createAPIClient('http://localhost:3001')
    expect(testClient).toBeInstanceOf(APIClient)
  })

  test('makes GET request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'UP' })
    })

    const response = await client.get('/health')
    expect(response.status).toBe('UP')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/health',
      expect.objectContaining({ method: 'GET' })
    )
  })

  test('makes POST request with body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: { id: '123' } })
    })

    const response = await client.post('/api/v1/chat', { message: 'test' })
    expect(response.result.id).toBe('123')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/v1/chat',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ message: 'test' })
      })
    )
  })

  test('handles API errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' })
    })

    await expect(client.get('/health')).rejects.toThrow(APIError)
  })

  test('handles network timeout', async () => {
    mockFetch.mockRejectedValueOnce(new Error('AbortError'))

    // Simulate abort
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 100)

    await expect(client.get('/health')).rejects.toThrow(APIError)
  })

  test('handles connection error', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(client.get('/health')).rejects.toThrow(APIError)
  })
})

describe('Health Check Service', () => {
  let mockApiClient

  beforeEach(() => {
    mockApiClient = {
      get: jest.fn()
    }
  })

  test('checks backend health', async () => {
    mockApiClient.get.mockResolvedValueOnce({ status: 'UP' })

    const health = await checkBackendHealth(mockApiClient)
    expect(health.isHealthy).toBe(true)
    expect(health.status).toBe('UP')
  })

  test('handles health check failure', async () => {
    mockApiClient.get.mockRejectedValueOnce(new Error('Connection failed'))

    const health = await checkBackendHealth(mockApiClient)
    expect(health.isHealthy).toBe(false)
    expect(health.status).toBe('DOWN')
  })

  test('waits for backend ready', async () => {
    mockApiClient.get
      .mockRejectedValueOnce(new Error('Not ready'))
      .mockResolvedValueOnce({ status: 'UP' })

    const ready = await waitForBackendReady(mockApiClient, 5)
    expect(ready).toBe(true)
  })

  test('respects max attempts', async () => {
    mockApiClient.get.mockRejectedValue(new Error('Not ready'))

    const ready = await waitForBackendReady(mockApiClient, 2)
    expect(ready).toBe(false)
    expect(mockApiClient.get).toHaveBeenCalledTimes(2)
  })
})

describe('Error Handlers', () => {
  test('maps error codes to messages', () => {
    const error = { code: 'TIMEOUT' }
    const message = getErrorMessage(error)
    expect(message).toContain('too long')
  })

  test('extracts error messages from data', () => {
    const error = { data: { error: 'Custom error' } }
    const message = getErrorMessage(error)
    expect(message).toBe('Custom error')
  })

  test('formats chat errors', () => {
    const error = { code: 'CONNECTION_ERROR', message: 'Failed to connect' }
    const formatted = handleChatError(error)
    expect(formatted.type).toBe('error')
    expect(formatted.text).toContain('🔌')
  })
})

describe('Message Formatter', () => {
  test('formats bot response', () => {
    const response = { result: { title: 'Test todo' } }
    const formatted = formatBotResponse(response)
    expect(formatted).toContain('Test todo')
  })

  test('parses chat response with todos', () => {
    const response = {
      status: 'SUCCESS',
      result: [
        { id: '1', title: 'Test', completed: false }
      ]
    }
    const parsed = parseChatResponse(response)
    expect(parsed.todos).toHaveLength(1)
    expect(parsed.todos[0].title).toBe('Test')
  })

  test('parses error response', () => {
    const response = {
      status: 'FAILED',
      error: 'Invalid request'
    }
    const parsed = parseChatResponse(response)
    expect(parsed.error).toBe('Invalid request')
    expect(parsed.text).toContain('❌')
  })
})
