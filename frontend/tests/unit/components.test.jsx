import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatInterface from '../../src/components/ChatInterface'
import MessageList from '../../src/components/MessageList'
import MessageInput from '../../src/components/MessageInput'
import UserMessage from '../../src/components/UserMessage'
import BotMessage from '../../src/components/BotMessage'
import WelcomeMessage from '../../src/components/WelcomeMessage'
import LoadingIndicator from '../../src/components/LoadingIndicator'
import ErrorMessage from '../../src/components/ErrorMessage'
import { ChatProvider } from '../../src/context/ChatContext'

describe('Chat Components', () => {
  describe('MessageInput', () => {
    test('renders input field and send button', () => {
      render(<MessageInput onSend={jest.fn()} />)
      expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
    })

    test('validates non-empty messages', async () => {
      const onSend = jest.fn()
      render(<MessageInput onSend={onSend} />)
      const sendButton = screen.getByRole('button', { name: /send message/i })
      expect(sendButton).toBeDisabled()

      const input = screen.getByPlaceholderText(/type your message/i)
      await userEvent.type(input, 'Hello')
      expect(sendButton).not.toBeDisabled()
    })

    test('sends message on button click', async () => {
      const onSend = jest.fn()
      render(<MessageInput onSend={onSend} />)
      const input = screen.getByPlaceholderText(/type your message/i)
      const sendButton = screen.getByRole('button', { name: /send message/i })

      await userEvent.type(input, 'Test message')
      await act(async () => {
        fireEvent.click(sendButton)
      })

      expect(onSend).toHaveBeenCalledWith('Test message')
    })

    test('sends message on Enter key', async () => {
      const onSend = jest.fn()
      render(<MessageInput onSend={onSend} />)
      const input = screen.getByPlaceholderText(/type your message/i)

      await userEvent.type(input, 'Test message')
      await act(async () => {
        fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })
      })

      expect(onSend).toHaveBeenCalledWith('Test message')
    })

    test('enforces max 500 character limit', async () => {
      render(<MessageInput onSend={jest.fn()} />)
      const input = screen.getByPlaceholderText(/type your message/i)
      const longMessage = 'a'.repeat(510)

      await userEvent.type(input, longMessage)
      expect(input.value.length).toBeLessThanOrEqual(500)
    })
  })

  describe('MessageList', () => {
    test('renders empty list', () => {
      const { container } = render(<MessageList messages={[]} />)
      expect(container.querySelector('[role="log"]')).toBeInTheDocument()
    })

    test('displays messages in order', () => {
      const messages = [
        { id: '1', sender: 'user', text: 'Hello' },
        { id: '2', sender: 'bot', text: 'Hi there!' }
      ]
      render(<MessageList messages={messages} />)

      const userMsg = screen.getByText('Hello')
      const botMsg = screen.getByText('Hi there!')

      expect(userMsg).toBeInTheDocument()
      expect(botMsg).toBeInTheDocument()
    })

    test('scrolls to bottom when new messages arrive', async () => {
      const { rerender } = render(<MessageList messages={[]} />)
      const endRef = jest.fn()

      const messages = [{ id: '1', sender: 'user', text: 'Hello' }]
      rerender(<MessageList messages={messages} />)

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument()
      })
    })
  })

  describe('UserMessage', () => {
    test('renders user message', () => {
      render(<UserMessage text="Test message" />)
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })

    test('displays timestamp', () => {
      const timestamp = '2025-12-23T10:00:00Z'
      render(<UserMessage text="Test" timestamp={timestamp} />)
      // Check for time in AM/PM format (timezone-agnostic)
      const timeElement = screen.getByText(/\d{1,2}:\d{2}\s(AM|PM)/i)
      expect(timeElement).toBeInTheDocument()
    })
  })

  describe('BotMessage', () => {
    test('renders bot message', () => {
      render(<BotMessage text="Bot response" />)
      expect(screen.getByText('Bot response')).toBeInTheDocument()
    })

    test('shows loading indicator when isLoading true', () => {
      render(<BotMessage text="Loading..." isLoading={true} />)
      expect(screen.getByText(/Thinking/i)).toBeInTheDocument()
    })
  })

  describe('WelcomeMessage', () => {
    test('renders welcome message', () => {
      render(<WelcomeMessage />)
      expect(screen.getByText(/Todo Chatbot/i)).toBeInTheDocument()
      expect(screen.getByText(/add Buy groceries/i)).toBeInTheDocument()
    })
  })

  describe('LoadingIndicator', () => {
    test('renders loading state', () => {
      render(<LoadingIndicator />)
      expect(screen.getByText(/Thinking/i)).toBeInTheDocument()
    })
  })

  describe('ErrorMessage', () => {
    test('renders error message', () => {
      render(<ErrorMessage message="Test error" />)
      expect(screen.getByText('Test error')).toBeInTheDocument()
    })

    test('calls onRetry when retry button clicked', () => {
      const onRetry = jest.fn()
      render(<ErrorMessage message="Test error" onRetry={onRetry} />)
      fireEvent.click(screen.getByText(/Retry/i))
      expect(onRetry).toHaveBeenCalled()
    })
  })

  describe('ChatInterface', () => {
    test('renders chat interface with provider', () => {
      const mockApiClient = {
        post: jest.fn()
      }

      render(
        <ChatProvider>
          <ChatInterface apiClient={mockApiClient} />
        </ChatProvider>
      )

      expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument()
    })
  })
})
