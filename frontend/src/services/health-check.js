export const checkBackendHealth = async (apiClient) => {
  try {
    // Simple health check: if we can make an API request, backend is responding
    // Just send a valid message format
    const response = await apiClient.post('/v1/chat', { message: 'hello' })
    // If we get any response back (whether success or failure), backend is up
    return {
      isHealthy: true,
      status: 'UP'
    }
  } catch (error) {
    console.warn('Health check failed:', error.message)
    return {
      isHealthy: false,
      status: 'DOWN',
      error: error.message
    }
  }
}

export const waitForBackendReady = async (apiClient, maxAttempts = 5) => {
  let attempts = 0

  while (attempts < maxAttempts) {
    const health = await checkBackendHealth(apiClient)
    if (health.isHealthy) {
      return true
    }
    attempts++
    if (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  return false
}

export default {
  checkBackendHealth,
  waitForBackendReady
}
