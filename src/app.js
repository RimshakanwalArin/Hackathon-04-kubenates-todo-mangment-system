import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from './utils/logger.js';
import errorHandler from './middleware/error-handler.js';
import loggingMiddleware from './middleware/logging.js';
import routes from './routes.js';

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Request ID generation middleware (must be first)
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Built-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom middleware
app.use(loggingMiddleware);

// Health check endpoints (minimal, no dependencies)
app.get('/health', (req, res) => {
  res.json({ status: 'UP' });
});

app.get('/ready', (req, res) => {
  res.json({ status: 'ready' });
});

// API routes
app.use('/api/v1', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    code: 'NOT_FOUND',
    path: req.path
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Server startup (only when run directly, not when imported)
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} (${NODE_ENV} mode)`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Only start server if running directly (not imported in tests)
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export default app;
