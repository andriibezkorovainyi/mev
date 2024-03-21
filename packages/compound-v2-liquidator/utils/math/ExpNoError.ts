const expScale = BigInt(1e18);

export function mulScalarTruncateAddUInt(
  mantissa: bigint,
  scalar: bigint,
  addend: bigint,
) {
  // // Выполнение операции умножения с учетом масштаба expScale
  // const product = mantissa * scalar;
  //
  // // Округление результата умножения до целого числа с учетом масштаба
  // const truncatedProduct = product / expScale;
  const truncatedProduct = mul_Mantissa(mantissa, scalar);

  // Добавление округленного значения к целому числу
  const result = truncatedProduct + addend;

  return result;
}

export function mul_Mantissa(a: bigint, b: bigint) {
  const product = a * b;

  return product / expScale;
}

export function mul_Plain(a: bigint, b: bigint) {
  return a * b;
}
