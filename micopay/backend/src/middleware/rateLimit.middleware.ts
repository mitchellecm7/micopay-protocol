import type { preHandlerHookHandler } from 'fastify';
import { RateLimitError } from '../utils/errors.js';

export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ current: number; resetTime: number }>;
}

export class InMemoryStore implements RateLimitStore {
  private hits = new Map<string, { count: number; expiresAt: number }>();

  async increment(key: string, windowMs: number): Promise<{ current: number; resetTime: number }> {
    const now = Date.now();
    const record = this.hits.get(key);

    if (!record || record.expiresAt <= now) {
      const expiresAt = now + windowMs;
      this.hits.set(key, { count: 1, expiresAt });
      return { current: 1, resetTime: expiresAt };
    }

    record.count += 1;
    return { current: record.count, resetTime: record.expiresAt };
  }
}

const defaultStore = new InMemoryStore();

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (request: any) => string;
  store?: RateLimitStore;
}

export function createRateLimiter(options: RateLimitOptions): preHandlerHookHandler {
  const {
    windowMs,
    max,
    keyGenerator = (req) => req.ip,
    store = defaultStore,
  } = options;

  return async (request, reply) => {
    const key = keyGenerator(request);
    const { current, resetTime } = await store.increment(key, windowMs);

    if (current > max) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      reply.header('Retry-After', retryAfter);
      throw new RateLimitError(`Too many requests. Please try again in ${retryAfter} seconds.`, retryAfter);
    }
  };
}
