export function reviver(key, value) {
  if (Array.isArray(value) && Array.isArray(value[0])) {
    return new Map(value);
  }

  // Обработка BigInt, включая отрицательные значения
  if (typeof value === 'string') {
    const bigintMatch = value.match(/^(-?\d+)n$/);
    if (bigintMatch) {
      return BigInt(bigintMatch[1]);
    }
  }

  if (key === 'allMarkets' || key === 'accounts') {
    return new Set(value);
  }

  return value;
}
