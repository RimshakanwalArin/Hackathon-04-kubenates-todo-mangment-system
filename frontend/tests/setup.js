import '@testing-library/jest-dom'

// Mock import.meta.env for Vite
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_BASE_URL: 'http://localhost:3001',
    VITE_API_TIMEOUT: '5000',
    VITE_APP_NAME: 'Todo Chatbot',
    VITE_LOG_LEVEL: 'info',
    DEV: false,
    PROD: true
  },
  writable: true
})

// Mock environment variables
process.env.VITE_API_BASE_URL = 'http://localhost:3001'
process.env.VITE_API_TIMEOUT = '5000'

// Suppress console errors in tests unless needed
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit') ||
        args[0].includes('Cannot use'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Setup global test utilities
global.fetch = jest.fn()
