export function deepCopy(obj: any) {
  // Проверяем, является ли элемент массивом или объектом
  if (typeof obj !== 'object' || obj === null) {
    return obj; // Возвращаем значение, если оно не объект/массив
  }

  // Создаем новый массив или объект, в зависимости от типа входящего
  const copy = Array.isArray(obj) ? [] : {};

  // Рекурсивно копируем каждое свойство
  for (const key in obj) {
    const value = obj[key];
    // @ts-ignore
    copy[key] = deepCopy(value); // Рекурсия для вложенных объектов/массивов
  }

  return copy;
}
