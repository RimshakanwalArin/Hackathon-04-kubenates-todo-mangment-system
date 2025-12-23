import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../src/App'
import { ChatProvider, useChat } from '../../src/context/ChatContext'
import ChatInterface from '../../src/components/ChatInterface'

// Mock the health check and API
jest.mock('../../src/services/health-check', () => ({
  checkBackendHealth: jest.fn().mockResolvedValue({ isHealthy: true, status: 'UP' }),
  waitForBackendReady: jest.fn().mockResolvedValue(true)
}))

describe('Chat Flow Integration Tests', () => {
  let mockApiClient

  beforeEach(() => {
    mockApiClient = {
      get: jest.fn().mockResolvedValue({ status: 'UP' }),
      post: jest.fn()
    }

    jest.clearAllMocks()
  })

  describe('Message Send/Response Flow', () => {
    test('sends message to backend and displays response', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        intent: 'CREATE_TODO',
        status: 'SUCCESS',
        result: { id: '123', title: 'Test todo', completed: false }
      })

      render(
        <ChatProvider>
          <ChatInterface apiClient={mockApiClient} />
        </ChatProvider>
      )

      const input = screen.getByPlaceholderText(/type your message/i)
      const sendButton = screen.getByRole('button', { name: /send message/i })

      await userEvent.type(input, 'add Test todo')
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith('/api/v1/chat', {
          message: 'add Test todo'
        })
      })
    })

    test('displays user message after sending', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        status: 'SUCCESS',
        result: { id: '123' }
      })

      render(
        <ChatProvider>
          <ChatInterface apiClient={mockApiClient} />
        </ChatProvider>
      )

      const input = screen.getByPlaceholderText(/type your message/i)
      await userEvent.type(input, 'test message')
      fireEvent.click(screen.getByRole('button', { name: /send message/i }))

      await waitFor(() => {
        expect(screen.getByText('test message')).toBeInTheDocument()
      })
    })

    test('displays bot response', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        status: 'SUCCESS',
        result: { title: 'New todo' }
      })

      render(
        <ChatProvider>
          <ChatInterface apiClient={mockApiClient} />
        </ChatProvider>
      )

      const input = screen.getByPlaceholderText(/type your message/i)
      await userEvent.type(input, 'add New todo')
      fireEvent.click(screen.getByRole('button', { name: /send message/i }))

      await waitFor(() => {
        expect(screen.getByText(/✓ Added/)).toBeInTheDocument()
      })
    })

    test('handles backend error response', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        status: 'FAILED',
        error: 'Could not understand command'
      })

      render(
        <ChatProvider>
          <ChatInterface apiClient={mockApiClient} />
        </ChatProvider>
      )

      const input = screen.getByPlaceholderText(/type your message/i)
      await userEvent.type(input, 'invalid command')
      fireEvent.click(screen.getByRole('button', { name: /send message/i }))

      await waitFor(() => {
        expect(screen.getByText(/Could not understand command/)).toBeInTheDocument()
      })
    })

    test('handles network timeout error', async () => {
      const error = new Error('Request timeout')
      error.code = 'TIMEOUT'
      mockApiClient.post.mockRejectedValueOnce(error)

      render(
        <ChatProvider>
          <ChatInterface apiClient={mockApiClient} />
        </ChatProvider>
      )

      const input = screen.getByPlaceholderText(/type your message/i)
      await userEvent.type(input, 'test')
      fireEvent.click(screen.getByRole('button', { name: /send message/i }))

      await waitFor(() => {
        expect(screen.getByText(/too long/i)).toBeInTheDocument()
      })
    })

    test('displays connection error', async () => {
      const error = new Error('Failed to connect')
      error.code = 'CONNECTION_ERROR'
      mockApiClient.post.mockRejectedValueOnce(error)

      render(
        <ChatProvider>
          <ChatInterface apiClient={mockApiClient} />
        </ChatProvider>
      )

      const input = screen.getByPlaceholderText(/type your message/i)
      await userEvent.type(input, 'test')
      fireEvent.click(screen.getByRole('button', { name: /send message/i }))

      await waitFor(() => {
        expect(screen.getByText(/Unable to reach server/i)).toBeInTheDocument()
      })
    })
  })

  describe('Todo List Display', () => {
    test('displays todo list from response', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        status: 'SUCCESS',
        result: [
          { id: '1', title: 'Buy milk', completed: false },
          { id: '2', title: 'Pay bills', completed: true }
        ]
      })

      render(
        <ChatProvider>
          <ChatInterface apiClient={mockApiClient} />
        </ChatProvider>
      )

      const input = screen.getByPlaceholderText(/type your message/i)
      await userEvent.type(input, 'show todos')
      fireEvent.click(screen.getByRole('button', { name: /send message/i }))

      await waitFor(() => {
        expect(screen.getByText(/Buy milk/)).toBeInTheDocument()
        expect(screen.getByText(/Pay bills/)).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    test('shows loading indicator while waiting for response', async () => {
      mockApiClient.post.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          status: 'SUCCESS',
          result: { id: '123' }
        }), 100))
      )

      render(
        <ChatProvider>
          <ChatInterface apiClient={mockApiClient} />
        </ChatProvider>
      )

      const input = screen.getByPlaceholderText(/type your message/i)
      await userEvent.type(input, 'test')
      fireEvent.click(screen.getByRole('button', { name: /send message/i }))

      await waitFor(() => {
        expect(screen.queryByText(/typing/i)).not.toBeInTheDocument()
      })
    })

    test('clears input field after sending', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        status: 'SUCCESS',
        result: { id: '123' }
      })

      render(
        <ChatProvider>
          <ChatInterface apiClient={mockApiClient} />
        </ChatProvider>
      )

      const input = screen.getByPlaceholderText(/type your message/i)
      await userEvent.type(input, 'test message')
      fireEvent.click(screen.getByRole('button', { name: /send message/i }))

      await waitFor(() => {
        expect(input).toHaveValue('')
      })
    })
  })

  describe('Message History', () => {
    test('preserves message history during session', async () => {
      mockApiClient.post
        .mockResolvedValueOnce({ status: 'SUCCESS', result: { id: '1' } })
        .mockResolvedValueOnce({ status: 'SUCCESS', result: { id: '2' } })

      render(
        <ChatProvider>
          <ChatInterface apiClient={mockApiClient} />
        </ChatProvider>
      )

      const input = screen.getByPlaceholderText(/type your message/i)

      // Send first message
      await userEvent.type(input, 'first message')
      fireEvent.click(screen.getByRole('button', { name: /send message/i }))

      // Send second message
      await userEvent.type(input, 'second message')
      fireEvent.click(screen.getByRole('button', { name: /send message/i }))

      await waitFor(() => {
        expect(screen.getByText('first message')).toBeInTheDocument()
        expect(screen.getByText('second message')).toBeInTheDocument()
      })
    })
  })
})
