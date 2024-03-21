export function mulDiv(a: bigint, b: bigint, denominator: bigint) {
  // Проверка на ноль в знаменателе
  if (denominator === 0n) throw new Error('Denominator cannot be zero');

  // Умножение и деление выполняются непосредственно с использованием BigInt
  const product = a * b;
  const remainder = product % denominator;
  const quotient = product / denominator;

  // Проверка на переполнение не требуется, так как BigInt поддерживает арбитральную точность
  return remainder === 0n ? quotient : quotient + 1n;
}
