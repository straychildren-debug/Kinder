/**
 * Форматирует имя автора: если оно слишком длинное, сокращает до инициалов.
 * Например: "Константин Константинопольский" -> "К. Константинопольский"
 */
export function formatAuthor(name: string, maxLength: number = 18): string {
  if (!name) return 'Автор';
  if (name.length <= maxLength) return name;

  const parts = name.split(' ').filter(Boolean);
  if (parts.length <= 1) return name.length > maxLength ? name.slice(0, maxLength - 3) + '...' : name;

  const lastPart = parts[parts.length - 1];
  const initials = parts.slice(0, parts.length - 1)
    .map(p => p.charAt(0).toUpperCase() + '.')
    .join(' ');

  const result = `${initials} ${lastPart}`;
  
  // Если даже с инициалами слишком длинно, просто обрезаем
  if (result.length > maxLength) {
    return result.slice(0, maxLength - 3) + '...';
  }

  return result;
}
