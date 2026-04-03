export type LogLevel = 'info' | 'warn' | 'error';

export interface LogMetadata {
  route?: string;
  requestId?: string;
  statusCode?: number;
  [key: string]: unknown;
}

function serializeError(error: unknown): Record<string, unknown> | undefined {
  if (!error) {
    return undefined;
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    value: String(error),
  };
}

function write(level: LogLevel, message: string, metadata?: LogMetadata): void {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    metadata: metadata ?? {},
  };

  if (level === 'error') {
    console.error(JSON.stringify(payload));
    return;
  }

  if (level === 'warn') {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.info(JSON.stringify(payload));
}

export const serverLogger = {
  info(message: string, metadata?: LogMetadata): void {
    write('info', message, metadata);
  },
  warn(message: string, metadata?: LogMetadata): void {
    write('warn', message, metadata);
  },
  error(message: string, error?: unknown, metadata?: LogMetadata): void {
    write('error', message, {
      ...metadata,
      error: serializeError(error),
    });
  },
};
