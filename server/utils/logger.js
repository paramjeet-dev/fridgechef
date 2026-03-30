import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format: [timestamp] LEVEL: message
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return stack
    ? `${timestamp} ${level}: ${message}\n${stack}` // Print stack for errors
    : `${timestamp} ${level}: ${message}`;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // Capture stack traces on Error objects
    logFormat
  ),
  transports: [
    // Console: colourised for readability in development
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'HH:mm:ss' }),
        logFormat
      ),
    }),
    // File: full logs (production observability)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB per file
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
  // Don't crash on uncaught exceptions — log them instead
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

export default logger;
