export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object' && typeof (value as any).toNumber === 'function') {
    return (value as any).toNumber();
  }
  const coerced = Number(value);
  return isNaN(coerced) ? null : coerced;
}