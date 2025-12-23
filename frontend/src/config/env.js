export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
}

export const getApiTimeout = () => {
  return parseInt(import.meta.env.VITE_API_TIMEOUT || '5000', 10)
}

export const getAppConfig = () => {
  return {
    apiBaseUrl: getApiBaseUrl(),
    apiTimeout: getApiTimeout(),
    appName: import.meta.env.VITE_APP_NAME || 'Todo Chatbot',
    logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD
  }
}

export default {
  getApiBaseUrl,
  getApiTimeout,
  getAppConfig
}
