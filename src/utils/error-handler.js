/**
 * Standardized error response class
 */
export class AppError extends Error {
  constructor(message, code = 'INTERNAL_ERROR', statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

/**
 * Error code to HTTP status mapping
 */
const ERROR_STATUS_MAP = {
  INVALID_TITLE: 400,
  INVALID_TYPE: 400,
  INVALID_JSON: 400,
  INVALID_UUID: 400,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
  UNEXPECTED_ERROR: 500
};

/**
 * Create standardized error response
 * @param {Error} err - Error object
 * @param {string} requestId - Request ID for tracing
 * @returns {Object} Error response
 */
export function createErrorResponse(err, requestId) {
  const code = err.code || 'INTERNAL_ERROR';
  const statusCode = ERROR_STATUS_MAP[code] || 500;

  return {
    error: err.message,
    code,
    requestId,
    timestamp: new Date().toISOString(),
    // Stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };
}

export default { AppError, createErrorResponse };
