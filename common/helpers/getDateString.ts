export function getDateString() {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // Получаем дату в формате YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0]; // Получаем время в формате HH:MM:SS
  return date + 'T' + time;
}
