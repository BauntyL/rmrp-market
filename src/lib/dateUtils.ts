/**
 * Безопасно форматирует дату, предотвращая ошибку "Invalid time value"
 * @param date Дата для форматирования (Date, строка или undefined)
 * @param options Опции форматирования для Intl.DateTimeFormat
 * @param fallback Значение, возвращаемое при ошибке (по умолчанию "Н/Д")
 * @returns Отформатированная дата или fallback при ошибке
 */
export const formatDate = (
  date: Date | string | undefined,
  options?: Intl.DateTimeFormatOptions,
  fallback: string = 'Н/Д'
): string => {
  if (!date) return fallback;
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Проверка на валидность даты
    if (isNaN(dateObj.getTime())) {
      return fallback;
    }
    
    return new Intl.DateTimeFormat('ru-RU', options).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return fallback;
  }
};