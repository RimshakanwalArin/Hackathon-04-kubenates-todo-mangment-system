import winston from 'winston';

const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    // Custom format: exclude sensitive data
    winston.format.printf(({ level, message, timestamp, requestId, ...meta }) => {
      const logObj = {
        timestamp,
        level,
        message,
        ...(requestId && { requestId }),
        ...meta
      };
      return JSON.stringify(logObj);
    })
  ),
  defaultMeta: { service: 'todo-api' },
  transports: [
    new winston.transports.Console({
      format: NODE_ENV === 'development'
        ? winston.format.simple()
        : winston.format.json()
    })
  ]
});

export default logger;
