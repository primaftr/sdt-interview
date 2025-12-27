export function getBackoffDelay(attempts: number): number {
  const base = 60_000; // 1 minute
  const max = 60 * 60_000; // 1 hour

  return Math.min(base * Math.pow(2, attempts), max);
}
