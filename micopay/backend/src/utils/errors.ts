export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(409, message);
    this.name = 'ConflictError';
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(400, message);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', public retryAfter?: number) {
    super(429, message);
    this.name = 'RateLimitError';
  }
}

/**
 * Thrown when a Stellar tx hash has already been processed.
 * HTTP 409 — the outcome of a replayed tx is deterministic, so this is
 * a conflict rather than a validation failure.
 */
export class ReplayError extends AppError {
  public readonly txHash: string;
  public readonly originalRoute: string;

  constructor(txHash: string, originalRoute: string) {
    super(409, `Stellar tx ${txHash} has already been processed via ${originalRoute}`);
    this.name = 'ReplayError';
    this.txHash = txHash;
    this.originalRoute = originalRoute;
  }
}
