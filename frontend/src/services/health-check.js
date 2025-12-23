export const checkBackendHealth = async (apiClient) => {
  try {
    const response = await apiClient.get('/health')
    return {
      isHealthy: response.status === 'UP',
      status: response.status
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
