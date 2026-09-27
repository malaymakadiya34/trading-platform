export type RetryOptions = {
  attempts?: number;
  delayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? 3);
  const delayMs = Math.max(0, options.delayMs ?? 250);
  const shouldRetry = options.shouldRetry ?? (() => true);
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !shouldRetry(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError;
}
