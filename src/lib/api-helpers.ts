import { NextRequest, NextResponse } from 'next/server';

export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: string | object
) {
  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && details && { details }),
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status });
}

export function handleApiError(error: unknown, operation: string = 'operation') {
  console.error(`Error in ${operation}:`, error);

  const errorObj = error as { code?: string; message?: string; name?: string };

  // Firebase errors
  if (errorObj.code?.startsWith('auth/')) {
    return createErrorResponse(
      'Authentication error. Please try again.',
      401,
      errorObj.message
    );
  }

  if (errorObj.code?.startsWith('firestore/')) {
    return createErrorResponse(
      'Database error. Please try again.',
      500,
      errorObj.message
    );
  }

  // Network errors
  if (errorObj.code === 'NETWORK_ERROR') {
    return createErrorResponse(
      'Network error. Please check your connection.',
      503,
      errorObj.message
    );
  }

  // Validation errors
  if (errorObj.name === 'ValidationError') {
    return createErrorResponse(
      'Invalid data provided.',
      400,
      errorObj.message
    );
  }

  // Default error
  return createErrorResponse(
    'An unexpected error occurred. Please try again.',
    500,
    errorObj.message || 'Unknown error'
  );
}

export async function withErrorHandling(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  operation?: string
) {
  try {
    return await handler(req);
  } catch (error) {
    return handleApiError(error, operation);
  }
}

// Rate limiting helper
export function checkRateLimit(req: NextRequest, maxRequests: number = 10) {
  // In production, you might want to implement proper rate limiting
  // using Redis or a rate limiting service
  console.log(`Rate limit check for ${req.url}, max: ${maxRequests}`);
  return true;
}

// Input validation helper
export function validateInput<T>(data: unknown, schema: { parse: (data: unknown) => T }): T {
  try {
    return schema.parse(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    throw new Error(`Validation failed: ${errorMessage}`);
  }
}
