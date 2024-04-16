export default (key, value) => {
  if (value instanceof Map) {
    return Array.from(value);
  }

  if (typeof value === 'bigint') {
    return value + 'n';
  }

  if (value instanceof Set) {
    return Array.from(value);
  }

  return value;
};
