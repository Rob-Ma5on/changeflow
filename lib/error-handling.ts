import { NextResponse } from 'next/server';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { ZodError } from 'zod';

// Error types
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  BUSINESS_RULE_ERROR = 'BUSINESS_RULE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

export interface AppError extends Error {
  type: ErrorType;
  code: string;
  statusCode: number;
  details?: any;
  context?: Record<string, any>;
  userMessage?: string;
}

// Custom error classes
export class ValidationError extends Error implements AppError {
  type = ErrorType.VALIDATION_ERROR;
  code = 'VALIDATION_FAILED';
  statusCode = 400;
  details?: any;
  context?: Record<string, any>;
  userMessage: string;

  constructor(message: string, details?: any, context?: Record<string, any>) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
    this.context = context;
    this.userMessage = 'The provided data is not valid. Please check your input and try again.';
  }
}

export class AuthorizationError extends Error implements AppError {
  type = ErrorType.AUTHORIZATION_ERROR;
  code = 'AUTHORIZATION_FAILED';
  statusCode = 403;
  details?: any;
  context?: Record<string, any>;
  userMessage: string;

  constructor(message: string, details?: any, context?: Record<string, any>) {
    super(message);
    this.name = 'AuthorizationError';
    this.details = details;
    this.context = context;
    this.userMessage = 'You do not have permission to perform this action.';
  }
}

export class NotFoundError extends Error implements AppError {
  type = ErrorType.NOT_FOUND_ERROR;
  code = 'RESOURCE_NOT_FOUND';
  statusCode = 404;
  details?: any;
  context?: Record<string, any>;
  userMessage: string;

  constructor(resource: string, identifier?: string, context?: Record<string, any>) {
    const message = identifier ? `${resource} with identifier '${identifier}' not found` : `${resource} not found`;
    super(message);
    this.name = 'NotFoundError';
    this.context = context;
    this.userMessage = `The requested ${resource.toLowerCase()} could not be found.`;
  }
}

export class BusinessRuleError extends Error implements AppError {
  type = ErrorType.BUSINESS_RULE_ERROR;
  code = 'BUSINESS_RULE_VIOLATION';
  statusCode = 422;
  details?: any;
  context?: Record<string, any>;
  userMessage: string;

  constructor(message: string, details?: any, context?: Record<string, any>) {
    super(message);
    this.name = 'BusinessRuleError';
    this.details = details;
    this.context = context;
    this.userMessage = 'This action violates business rules and cannot be completed.';
  }
}

export class DatabaseError extends Error implements AppError {
  type = ErrorType.DATABASE_ERROR;
  code = 'DATABASE_OPERATION_FAILED';
  statusCode = 500;
  details?: any;
  context?: Record<string, any>;
  userMessage: string;

  constructor(message: string, originalError?: any, context?: Record<string, any>) {
    super(message);
    this.name = 'DatabaseError';
    this.details = originalError;
    this.context = context;
    this.userMessage = 'A database error occurred. Please try again later.';
  }
}

export class ExternalServiceError extends Error implements AppError {
  type = ErrorType.EXTERNAL_SERVICE_ERROR;
  code = 'EXTERNAL_SERVICE_FAILED';
  statusCode = 502;
  details?: any;
  context?: Record<string, any>;
  userMessage: string;

  constructor(service: string, message: string, details?: any, context?: Record<string, any>) {
    super(`External service '${service}' error: ${message}`);
    this.name = 'ExternalServiceError';
    this.details = details;
    this.context = context;
    this.userMessage = `An external service error occurred. Please try again later.`;
  }
}

// Error handler utility class
export class ErrorHandler {
  private static logError(error: AppError, requestId?: string): void {
    const errorLog = {
      timestamp: new Date().toISOString(),
      requestId,
      type: error.type,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      context: error.context,
      stack: error.stack
    };

    // In production, this would integrate with logging service
    console.error('Application Error:', JSON.stringify(errorLog, null, 2));

    // For critical errors, you might want to send alerts
    if (error.statusCode >= 500) {
      // Send to error tracking service (Sentry, Datadog, etc.)
      // sendErrorAlert(errorLog);
    }
  }

  static handleError(error: unknown, requestId?: string): NextResponse {
    // Convert unknown error to AppError
    const appError = this.normalizeError(error);
    
    // Log the error
    this.logError(appError, requestId);

    // Return appropriate response
    return NextResponse.json({
      success: false,
      error: {
        type: appError.type,
        code: appError.code,
        message: appError.userMessage || appError.message,
        details: process.env.NODE_ENV === 'development' ? appError.details : undefined,
        requestId
      }
    }, { status: appError.statusCode });
  }

  private static normalizeError(error: unknown): AppError {
    // Handle custom AppErrors
    if (this.isAppError(error)) {
      return error;
    }

    // Handle Prisma errors
    if (error instanceof PrismaClientKnownRequestError) {
      return this.handlePrismaError(error);
    }

    if (error instanceof PrismaClientValidationError) {
      return new ValidationError('Invalid data provided to database', error.message);
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return new ValidationError('Validation failed', error.errors);
    }

    // Handle standard errors
    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        return new ExternalServiceError('Network', 'Connection failed', error.message);
      }

      if (error.message.includes('Unauthorized')) {
        return new AuthorizationError(error.message);
      }

      if (error.message.includes('Not found')) {
        return new NotFoundError('Resource', undefined, { originalMessage: error.message });
      }

      // Generic internal server error
      return new DatabaseError('Internal server error', error.message);
    }

    // Handle unknown error types
    return new DatabaseError('Unknown error occurred', String(error));
  }

  private static handlePrismaError(error: PrismaClientKnownRequestError): AppError {
    switch (error.code) {
      case 'P2001':
        return new NotFoundError('Record', 'unique identifier');
      
      case 'P2002':
        const field = error.meta?.target as string[] | undefined;
        return new ValidationError(
          `Duplicate value for ${field?.join(', ') || 'unique field'}`,
          { field, value: error.meta }
        );
      
      case 'P2003':
        return new ValidationError('Foreign key constraint violation', error.meta);
      
      case 'P2004':
        return new ValidationError('Database constraint violation', error.meta);
      
      case 'P2025':
        return new NotFoundError('Record', 'required record for operation');
      
      case 'P2034':
        return new BusinessRuleError('Transaction failed due to constraint', error.meta);
      
      default:
        return new DatabaseError(`Database error: ${error.code}`, error.message);
    }
  }

  private static isAppError(error: unknown): error is AppError {
    return error instanceof Error && 'type' in error && 'code' in error && 'statusCode' in error;
  }
}

// Async error wrapper for API routes
export function asyncErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await fn(...args);
    } catch (error) {
      const requestId = Math.random().toString(36).substring(7);
      return ErrorHandler.handleError(error, requestId);
    }
  };
}

// Error boundary for React components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  ErrorFallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  return function WrappedComponent(props: P) {
    try {
      return <Component {...props} />;
    } catch (error) {
      if (ErrorFallback) {
        return <ErrorFallback error={error as Error} resetError={() => window.location.reload()} />;
      }
      
      return (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-600 mb-4">An error occurred while rendering this component.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
  };
}

// Workflow-specific error handlers
export class WorkflowErrorHandler {
  static handleECRError(error: unknown, ecrId?: string): AppError {
    const baseError = ErrorHandler['normalizeError'](error);
    
    if (baseError.type === ErrorType.VALIDATION_ERROR && ecrId) {
      return new ValidationError(
        `ECR validation failed`,
        baseError.details,
        { ecrId, ...baseError.context }
      );
    }
    
    if (baseError.type === ErrorType.BUSINESS_RULE_ERROR && ecrId) {
      return new BusinessRuleError(
        `ECR business rule violation`,
        baseError.details,
        { ecrId, ...baseError.context }
      );
    }
    
    return baseError;
  }

  static handleECOError(error: unknown, ecoId?: string): AppError {
    const baseError = ErrorHandler['normalizeError'](error);
    
    if (baseError.type === ErrorType.VALIDATION_ERROR && ecoId) {
      return new ValidationError(
        `ECO validation failed`,
        baseError.details,
        { ecoId, ...baseError.context }
      );
    }
    
    return baseError;
  }

  static handleECNError(error: unknown, ecnId?: string): AppError {
    const baseError = ErrorHandler['normalizeError'](error);
    
    if (baseError.type === ErrorType.VALIDATION_ERROR && ecnId) {
      return new ValidationError(
        `ECN validation failed`,
        baseError.details,
        { ecnId, ...baseError.context }
      );
    }
    
    return baseError;
  }

  static handlePermissionError(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string
  ): AuthorizationError {
    return new AuthorizationError(
      `User ${userId} not authorized to ${action} ${resource}`,
      { userId, action, resource, resourceId },
      { timestamp: new Date().toISOString() }
    );
  }

  static handleStatusTransitionError(
    entityType: 'ECR' | 'ECO' | 'ECN',
    entityId: string,
    currentStatus: string,
    targetStatus: string,
    userRole: string
  ): BusinessRuleError {
    return new BusinessRuleError(
      `Invalid status transition from ${currentStatus} to ${targetStatus} for ${entityType}`,
      {
        entityType,
        entityId,
        currentStatus,
        targetStatus,
        userRole,
        allowedTransitions: this.getAllowedTransitions(entityType, currentStatus)
      }
    );
  }

  private static getAllowedTransitions(entityType: string, currentStatus: string): string[] {
    const transitionMap: Record<string, Record<string, string[]>> = {
      ECR: {
        'DRAFT': ['SUBMITTED', 'CANCELLED'],
        'SUBMITTED': ['UNDER_REVIEW', 'CANCELLED'],
        'UNDER_REVIEW': ['APPROVED', 'REJECTED', 'RETURNED_TO_SUBMITTER'],
        'RETURNED_TO_SUBMITTER': ['SUBMITTED', 'CANCELLED'],
        'APPROVED': ['CANCELLED'],
        'REJECTED': [],
        'CANCELLED': []
      },
      ECO: {
        'PLANNING': ['IN_PROGRESS', 'CANCELLED'],
        'IN_PROGRESS': ['VERIFICATION', 'ON_HOLD', 'CANCELLED'],
        'ON_HOLD': ['IN_PROGRESS', 'CANCELLED'],
        'VERIFICATION': ['COMPLETED', 'RETURNED_TO_IMPLEMENTATION'],
        'RETURNED_TO_IMPLEMENTATION': ['IN_PROGRESS'],
        'COMPLETED': [],
        'CANCELLED': []
      },
      ECN: {
        'PENDING_DISTRIBUTION': ['DISTRIBUTED', 'CANCELLED'],
        'DISTRIBUTED': ['ACKNOWLEDGED', 'CANCELLED'],
        'ACKNOWLEDGED': [],
        'CANCELLED': []
      }
    };

    return transitionMap[entityType]?.[currentStatus] || [];
  }
}

// Retry mechanism for transient errors
export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    shouldRetry: (error: unknown) => boolean = () => true
  ): Promise<T> {
    let lastError: unknown;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (!shouldRetry(error) || attempt === maxRetries) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  static shouldRetryDatabaseError(error: unknown): boolean {
    if (error instanceof PrismaClientKnownRequestError) {
      // Retry on connection errors, timeouts, etc.
      const retryableCodes = ['P1001', 'P1002', 'P1008', 'P1017'];
      return retryableCodes.includes(error.code);
    }
    
    if (error instanceof Error) {
      const retryableMessages = [
        'ECONNRESET',
        'ENOTFOUND',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'connection timeout'
      ];
      
      return retryableMessages.some(msg => 
        error.message.toLowerCase().includes(msg.toLowerCase())
      );
    }
    
    return false;
  }
}

// Input sanitization helpers
export class InputSanitizer {
  static sanitizeString(input: string, maxLength: number = 1000): string {
    return input
      .trim()
      .substring(0, maxLength)
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, ''); // Remove data: protocol
  }

  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  static sanitizeHTML(input: string): string {
    // Basic HTML sanitization - in production, use a library like DOMPurify
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      .replace(/javascript:/gi, '');
  }
}

// Rate limiting helper
export class RateLimiter {
  private static requests: Map<string, number[]> = new Map();
  
  static checkRateLimit(
    key: string,
    windowMs: number = 60000, // 1 minute
    maxRequests: number = 100
  ): { allowed: boolean; resetTime?: number } {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old requests
    const userRequests = this.requests.get(key) || [];
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      const resetTime = validRequests[0] + windowMs;
      return { allowed: false, resetTime };
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return { allowed: true };
  }
}

export default ErrorHandler;