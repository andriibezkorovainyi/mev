// export function mulDiv(a: bigint, b: bigint, denominator: bigint) {
//   // Проверка на ноль в знаменателе
//   if (denominator === 0n) throw new Error('Denominator cannot be zero');
//
//   // Умножение и деление выполняются непосредственно с использованием BigInt
//   const product = a * b;
//   const remainder = product % denominator;
//   const quotient = product / denominator;
//
//   // Проверка на переполнение не требуется, так как BigInt поддерживает арбитральную точность
//   return remainder === 0n ? quotient : quotient + 1n;
// }

export function mulDiv(a: bigint, b: bigint, denominator: bigint) {
  // Validate that denominator is not zero
  if (denominator === 0n) {
    throw new Error('Denominator cannot be zero');
  }

  // Perform the 512-bit multiplication [prod1 prod0] = a * b
  let prod0 = a * b; // Least significant 256 bits of the product
  const fullProduct = a * b; // Full product to capture overflow
  let prod1 = fullProduct / (1n << 256n); // Most significant 256 bits of the product

  // When prod1 is zero, we can simply perform a division
  if (prod1 === 0n) {
    return prod0 / denominator;
  }

  // Check that denominator is greater than prod1 to avoid overflow
  if (denominator <= prod1) {
    throw new Error(
      'Denominator must be greater than the most significant part of the product',
    );
  }

  // Compute the remainder
  const remainder = fullProduct % denominator;

  // Adjust product by the remainder
  if (remainder > prod0) {
    prod1 -= 1n;
    prod0 = prod0 + (1n << 256n) - remainder;
  } else {
    prod0 -= remainder;
  }

  // Factor powers of two out of denominator
  const twos = denominator & -denominator;
  denominator /= twos;
  prod0 /= twos;

  // Shift in bits from prod1 into prod0
  const shift = 256n - BigInt(Math.clz32(Number(twos)));
  prod0 += prod1 << shift;

  // Compute the modular inverse of denominator modulo 2**256
  let inv = (3n * denominator) ^ 2n;
  inv *= 2n - denominator * inv; // inverse mod 2**8
  inv *= 2n - denominator * inv; // inverse mod 2**16
  inv *= 2n - denominator * inv; // inverse mod 2**32
  inv *= 2n - denominator * inv; // inverse mod 2**64
  inv *= 2n - denominator * inv; // inverse mod 2**128
  inv *= 2n - denominator * inv; // inverse mod 2**256

  // Final division by multiplication with the modular inverse
  return prod0 * inv;
}

// export function mulDiv(a: bigint, b: bigint, denominator: bigint) {
//   a = BigInt(a);
//   b = BigInt(b);
//   denominator = BigInt(denominator);
//
//   if (denominator === 0n) {
//     throw new Error('Denominator cannot be zero');
//   }
//
//   let prod0 = a * b;
//   let prod1 = (a * b) >> BigInt(256);
//
//   if (prod1 === 0n) {
//     return prod0 / denominator;
//   }
//
//   if (denominator <= prod1) {
//     throw new Error(
//       'Denominator must be greater than the most significant 256 bits of the product',
//     );
//   }
//
//   const remainder = (a * b) % denominator;
//   if (remainder > prod0) {
//     prod1 -= 1n;
//     prod0 = prod0 + (BigInt(1) << BigInt(256)) - remainder;
//   } else {
//     prod0 -= remainder;
//   }
//
//   const twos = denominator & -denominator;
//   denominator /= twos;
//   prod0 /= twos;
//
//   const twosComplement = (BigInt(1) << BigInt(256)) / twos;
//   prod0 += prod1 * twosComplement;
//
//   // Compute the modular inverse of denominator modulo 2**256
//   let inv = (3n * denominator) ^ 2n;
//   inv *= 2n - denominator * inv; // inverse mod 2**8
//   inv *= 2n - denominator * inv; // inverse mod 2**16
//   inv *= 2n - denominator * inv; // inverse mod 2**32
//   inv *= 2n - denominator * inv; // inverse mod 2**64
//   inv *= 2n - denominator * inv; // inverse mod 2**128
//   inv *= 2n - denominator * inv; // inverse mod 2**256
//
//   return prod0 * inv ** BigInt(1e2);
// }
