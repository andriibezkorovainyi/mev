function binarySearch(arr, target) {
  let left = 0; // Начальный индекс
  let right = arr.length - 1; // Конечный индекс

  while (left <= right) {
    const mid = Math.floor((left + right) / 2); // Находим середину

    if (arr[mid] === target) {
      return mid; // Элемент найден
    }

    if (arr[mid] < target) {
      left = mid + 1; // Искать в правой половине
    } else {
      right = mid - 1; // Искать в левой половине
    }
  }

  return -1; // Элемент не найден
}

// Пример использования
const arr = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];
const target = 9;
const result = binarySearch(arr, target);

if (result !== -1) {
  console.log(`Элемент найден на позиции: ${result}`);
} else {
  console.log('Элемент не найден.');
}
