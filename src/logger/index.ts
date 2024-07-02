import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "HH:mm:ss.SSS",
    }),
    winston.format.printf(
      ({ level, message, label, timestamp }) =>
        `${timestamp} [${process.pid}] ${level.toUpperCase()} ${label || ""} - ${message}`,
    ),
  ),
  transports: [new winston.transports.Console()],
});

export function formatError(error: any): string {
  if (error instanceof Error) {
    return JSON.stringify({
      message: error.message,
      stack: error.stack,
    });
  }
  return JSON.stringify(error);
}

export default logger;
