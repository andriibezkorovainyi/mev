const expScale = BigInt(1e18);

export function mulScalarTruncateAddUInt(
  mantissa: bigint,
  scalar: bigint,
  addend: bigint,
) {
  const truncatedProduct = mul_Mantissa(mantissa, scalar);

  const result = truncatedProduct + addend;

  return result;
}

export function truncate(value: bigint) {
  return value / expScale;
}

export function mul_Mantissa(a: bigint, b: bigint) {
  const product = a * b;

  return product / expScale;
}

export function mul_Plain(a: bigint, b: bigint) {
  return a * b;
}

export function div_MantissaB(a: bigint, bMantissa: bigint) {
  return (a * expScale) / bMantissa;
}
