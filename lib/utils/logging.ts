/**
 * Structured Logging Utilities
 *
 * Provides reusable logging helpers for server actions with:
 * - Structured console logging with context
 * - Supabase error logging (message, code, details, hint)
 * - FormData debugging
 * - Zod validation logging
 * - Performance timing
 */

/**
 * Log levels
 */
export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success';

/**
 * Log metadata interface
 */
export interface LogMetadata {
  [key: string]: any;
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  includeTimestamp: boolean;
  includeStack: boolean;
  formatJson: boolean;
}

/**
 * Default configuration
 */
const defaultConfig: LoggerConfig = {
  enabled: process.env.NODE_ENV === 'development' || process.env.DEBUG_LOGGING === 'true',
  minLevel: 'info',
  includeTimestamp: true,
  includeStack: false,
  formatJson: false,
};

/**
 * Structured Logger Class
 *
 * Usage:
 * ```typescript
 * const logger = new StructuredLogger('CONTEXT_NAME');
 * logger.info('Message', { key: 'value' });
 * logger.error('Error', { error: err });
 * ```
 */
export class StructuredLogger {
  private context: string;
  private config: LoggerConfig;

  constructor(context: string, config?: Partial<LoggerConfig>) {
    this.context = context;
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, emoji: string, message: string, metadata?: LogMetadata) {
    if (!this.config.enabled) return;

    const timestamp = this.config.includeTimestamp ? new Date().toISOString() : undefined;

    const logData = {
      context: this.context,
      level,
      message,
      ...(timestamp && { timestamp }),
      ...(metadata && { metadata }),
      ...(this.config.includeStack && level === 'error' && { stack: new Error().stack }),
    };

    const prefix = `[${this.context}] ${emoji} ${message}`;

    const formattedMessage = this.config.formatJson
      ? JSON.stringify(logData, null, 2)
      : prefix;

    const metadataOutput = metadata && !this.config.formatJson ? metadata : '';

    switch (level) {
      case 'error':
        console.error(formattedMessage, metadataOutput);
        break;
      case 'warn':
        console.warn(formattedMessage, metadataOutput);
        break;
      case 'debug':
        console.debug(formattedMessage, metadataOutput);
        break;
      default:
        console.log(formattedMessage, metadataOutput);
    }
  }

  /**
   * Info log
   */
  info(message: string, metadata?: LogMetadata) {
    this.log('info', 'ℹ️', message, metadata);
  }

  /**
   * Success log
   */
  success(message: string, metadata?: LogMetadata) {
    this.log('success', '✅', message, metadata);
  }

  /**
   * Error log
   */
  error(message: string, metadata?: LogMetadata) {
    this.log('error', '❌', message, metadata);
  }

  /**
   * Warning log
   */
  warn(message: string, metadata?: LogMetadata) {
    this.log('warn', '⚠️', message, metadata);
  }

  /**
   * Debug log
   */
  debug(message: string, metadata?: LogMetadata) {
    this.log('debug', '🔍', message, metadata);
  }

  /**
   * Start operation log
   */
  start(message: string, metadata?: LogMetadata) {
    this.log('info', '🚀', `START - ${message}`, metadata);
  }

  /**
   * End operation log
   */
  end(message: string, metadata?: LogMetadata) {
    this.log('success', '🎉', `END - ${message}`, metadata);
  }
}

/**
 * Supabase Error Type
 */
export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
  statusText?: string;
  schema?: string;
  table?: string;
  constraint?: string;
  column?: string;
  dataType?: string;
}

/**
 * Log Supabase error with all available details
 *
 * Usage:
 * ```typescript
 * if (error) {
 *   logSupabaseError(logger, 'INSERT service_profiles', error, { userId: user.id });
 *   return { error: 'Failed' };
 * }
 * ```
 */
export function logSupabaseError(
  logger: StructuredLogger,
  operation: string,
  error: SupabaseError | null | undefined,
  context?: LogMetadata
) {
  if (!error) return null;

  const errorDetails = {
    message: error.message || 'Unknown error',
    code: error.code || null,
    details: error.details || null,
    hint: error.hint || null,
    status: error.status || null,
    statusText: error.statusText || null,
    schema: error.schema || null,
    table: error.table || null,
    constraint: error.constraint || null,
    column: error.column || null,
    dataType: error.dataType || null,
  };

  logger.error(`${operation} FAILED`, {
    supabaseError: errorDetails,
    fullError: JSON.stringify(error, null, 2),
    ...context,
  });

  return errorDetails;
}

/**
 * Get user-friendly error message from Supabase error code
 */
export function getUserFriendlyMessage(error: SupabaseError): string {
  if (!error.code) return 'Si è verificato un errore. Riprova più tardi.';

  // PostgreSQL error codes
  if (error.code === '23505') {
    return 'Questo elemento esiste già nel sistema';
  }
  if (error.code === '23503') {
    return 'Riferimento a dati non validi o eliminati';
  }
  if (error.code === '23502') {
    return 'Campo obbligatorio mancante';
  }
  if (error.code === '42501') {
    return 'Non hai i permessi per questa operazione';
  }
  if (error.code === '23514') {
    return 'I dati forniti non rispettano le regole di validazione';
  }
  if (error.code?.startsWith('22')) {
    return 'Formato dati non valido';
  }

  return 'Si è verificato un errore. Riprova più tardi.';
}

/**
 * Log FormData contents for debugging
 *
 * Usage:
 * ```typescript
 * const formDataObj = logFormData(logger, formData);
 * ```
 */
export function logFormData(logger: StructuredLogger, formData: FormData): Record<string, any> {
  const formDataObj: Record<string, any> = {};

  formData.forEach((value, key) => {
    try {
      // Try to parse JSON strings
      if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
        formDataObj[key] = JSON.parse(value);
      } else {
        formDataObj[key] = value;
      }
    } catch {
      // If parsing fails, use raw value
      formDataObj[key] = value;
    }
  });

  logger.debug('FormData Contents', {
    keys: Array.from(formData.keys()),
    values: formDataObj,
    fieldsCount: Array.from(formData.keys()).length,
  });

  return formDataObj;
}

/**
 * Log Zod validation result
 *
 * Usage:
 * ```typescript
 * const isValid = logZodValidation(logger, result, rawData, 'createProfessionalProfileSchema');
 * if (!isValid) return { error: 'Invalid data' };
 * ```
 */
export function logZodValidation(
  logger: StructuredLogger,
  result: any,
  rawData: any,
  schemaName: string
): boolean {
  if (!result.success) {
    logger.error('Zod Validation Failed', {
      schemaName,
      errors: result.error.flatten(),
      fieldErrors: result.error.flatten().fieldErrors,
      formErrors: result.error.flatten().formErrors,
      issues: result.error.issues,
      rawData: JSON.stringify(rawData, null, 2),
    });
    return false;
  }

  logger.success('Zod Validation Passed', {
    schemaName,
    parsedDataSummary: Object.keys(result.data),
  });

  return true;
}

/**
 * Performance timer for measuring operation duration
 *
 * Usage:
 * ```typescript
 * const timer = new PerformanceTimer(logger, 'Create Service Profile');
 * // ... do work ...
 * timer.end({ profileId: 'abc' });
 * ```
 */
export class PerformanceTimer {
  private startTime: number;
  private logger: StructuredLogger;
  private operation: string;

  constructor(logger: StructuredLogger, operation: string) {
    this.logger = logger;
    this.operation = operation;
    this.startTime = Date.now();
    this.logger.start(operation);
  }

  end(metadata?: LogMetadata) {
    const duration = Date.now() - this.startTime;
    this.logger.end(this.operation, {
      duration: `${duration}ms`,
      ...metadata,
    });
  }
}

/**
 * Safe JSON.parse with error handling and validation
 *
 * Usage:
 * ```typescript
 * const array = safeJsonParse<string[]>(formData.get('services'), []);
 * ```
 */
export function safeJsonParse<T>(
  value: string | null | undefined,
  defaultValue: T,
  validator?: (parsed: any) => parsed is T
): T {
  if (!value) return defaultValue;

  try {
    const parsed = JSON.parse(value);

    // If validator provided, use it
    if (validator && !validator(parsed)) {
      console.warn('[SAFE_JSON_PARSE] Validation failed, using default value');
      return defaultValue;
    }

    return parsed as T;
  } catch (error) {
    console.error('[SAFE_JSON_PARSE] Parse error:', {
      error: error instanceof Error ? error.message : String(error),
      value: value.substring(0, 100),
    });
    return defaultValue;
  }
}

/**
 * Type guard for string array
 */
export function isStringArray(value: any): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}
