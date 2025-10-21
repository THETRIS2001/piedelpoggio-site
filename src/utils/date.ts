// Utility per la gestione delle date
export function formatDate(date: Date, locale: string = 'it-IT'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatDateTime(date: Date, locale: string = 'it-IT'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateShort(date: Date, locale: string = 'it-IT'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function isUpcoming(date: Date): boolean {
  return date > new Date();
}

export function isPast(date: Date): boolean {
  return date < new Date();
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function formatTime(date: Date, locale: string = 'it-IT'): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function removeSecondsFromTime(timeString: string): string {
  // Rimuove i secondi da una stringa di tempo nel formato HH:MM:SS
  // Restituisce HH:MM
  if (timeString && timeString.includes(':')) {
    const parts = timeString.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
  }
  return timeString;
}

export function sortByDate<T extends { date?: Date; startsAt?: Date }>(
  items: T[],
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return items.sort((a, b) => {
    const dateA = a.date || a.startsAt;
    const dateB = b.date || b.startsAt;
    
    if (!dateA || !dateB) return 0;
    
    return order === 'desc' 
      ? dateB.getTime() - dateA.getTime()
      : dateA.getTime() - dateB.getTime();
  });
}