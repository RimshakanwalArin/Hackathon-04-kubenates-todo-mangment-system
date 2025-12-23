import '@testing-library/jest-dom'

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
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
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
