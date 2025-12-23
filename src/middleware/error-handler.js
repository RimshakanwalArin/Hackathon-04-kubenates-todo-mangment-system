import logger from '../utils/logger.js';
import { AppError, createErrorResponse } from '../utils/error-handler.js';

/**
 * Express error handling middleware
 * Must be last middleware
 */
export default function errorHandlerMiddleware(err, req, res, next) {
  const requestId = req.id || 'unknown';

  // Default to 500 if no status provided
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Internal Server Error';

  // Log error
  logger.error('Request error', {
    requestId,
    method: req.method,
    path: req.path,
    statusCode,
    code,
    message,
    stack: err.stack
  });

  // Create error response
  const errorResponse = createErrorResponse(
    new AppError(message, code, statusCode),
    requestId
  );

  res.status(statusCode).json(errorResponse);
}
