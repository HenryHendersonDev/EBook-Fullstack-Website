import { createLogger, format, transports } from 'winston';
import expressWinston from 'express-winston';
import 'winston-daily-rotate-file'; // Import for log rotation

// Create a custom console format for development
const consoleFormat = format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Dynamically determine the log level based on environment
const logLevel = process.env['NODE_ENV'] === 'production' ? 'info' : 'debug';

// Logger configuration
const logger = createLogger({
  level: logLevel,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }), // Include stack traces in error logs
    format.json()
  ),
  transports: [
    // Log rotation for error logs (rotates daily)
    new transports.DailyRotateFile({
      filename: 'logs/error/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d', // Keep logs for 30 days
    }),
    // Log rotation for combined logs (rotates daily)
    new transports.DailyRotateFile({
      filename: 'logs/combined/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
    }),
    new transports.File({
      filename: 'logs/warn/warn.log',
      level: 'warn',
    }),
    new transports.File({
      filename: 'logs/debug/debug.log',
      level: 'debug',
    }),
  ],
});

// Add console transport for development environment with pretty output
if (process.env['NODE_ENV'] !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    })
  );
}

// Request logger for HTTP requests
const requestLogger = expressWinston.logger({
  winstonInstance: logger,
  format: format.combine(format.colorize(), format.timestamp(), format.json()),
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false,
  ignoreRoute(req) {
    return req.url.startsWith('/winston-Skip-Route');
  },
  statusLevels: true,
  transports: [
    new transports.DailyRotateFile({
      filename: 'logs/requests/request-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d', // Keep request logs for 14 days
    }),
  ],
});

// Error logger for HTTP errors
const errorLogger = expressWinston.errorLogger({
  winstonInstance: logger,
  format: format.combine(format.colorize(), format.timestamp(), format.json()),
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  transports: [
    new transports.DailyRotateFile({
      filename: 'logs/errors/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
    }),
  ],
});

export { logger, requestLogger, errorLogger };
