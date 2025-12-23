require('@testing-library/jest-dom')

// Mock environment variables for Vite
process.env.VITE_API_BASE_URL = 'http://localhost:3001'
process.env.VITE_API_TIMEOUT = '5000'
process.env.VITE_APP_NAME = 'Todo Chatbot'
process.env.VITE_LOG_LEVEL = 'info'

// Mock global fetch
global.fetch = jest.fn()

// Mock scrollIntoView (not implemented in jsdom)
Element.prototype.scrollIntoView = jest.fn()

// Mock TextEncoder/TextDecoder if not available
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}

// Suppress specific console errors
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = jest.fn((...args) => {
    const message = String(args[0])
    if (
      message.includes('Cannot use') ||
      message.includes('Not implemented') ||
      message.includes('Warning: ReactDOM')
    ) {
      return
    }
    originalError.call(console, ...args)
  })

  console.warn = jest.fn((...args) => {
    const message = String(args[0])
    if (message.includes('deprecated') || message.includes('warn')) {
      return
    }
    originalWarn.call(console, ...args)
  })
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})
