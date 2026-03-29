import * as winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'debug';

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, stack, ...args }) => {
      const base = `${timestamp} [${level.toUpperCase()}]`;
      const msg = message;
      const argsStr = Object.keys(args).length ? ` ${JSON.stringify(args)}` : '';
      const stackStr = stack ? `\n${stack}` : '';
      return `${base} ${msg}${argsStr}${stackStr}`;
    }),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp }) => {
          return `${timestamp} [${level}] ${message}`;
        }),
      ),
    }),
  ],
});

export function getLogger(context: string) {
  return {
    debug: (message: string, data?: any) => {
      const fullMsg = data ? `${message} ${JSON.stringify(data)}` : message;
      logger.debug(`[${context}] ${fullMsg}`);
    },
    log: (message: string, data?: any) => {
      const fullMsg = data ? `${message} ${JSON.stringify(data)}` : message;
      logger.info(`[${context}] ${fullMsg}`);
    },
    error: (message: string, data?: any) => {
      const fullMsg = data ? `${message} ${JSON.stringify(data)}` : message;
      logger.error(`[${context}] ${fullMsg}`);
    },
    warn: (message: string, data?: any) => {
      const fullMsg = data ? `${message} ${JSON.stringify(data)}` : message;
      logger.warn(`[${context}] ${fullMsg}`);
    },
  };
}
