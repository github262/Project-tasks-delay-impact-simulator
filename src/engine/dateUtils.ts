/**
 * Date and working day utilities for project scheduling
 */

export function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export function formatISODate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(dateStr: string, options?: { includeYear?: boolean; shortMonth?: boolean }): string {
  try {
    const date = parseISODate(dateStr);
    const months = options?.shortMonth 
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const day = date.getUTCDate();
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();

    if (options?.includeYear !== false) {
      return `${month} ${day}, ${year}`;
    }
    return `${month} ${day}`;
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string): string {
  return formatDisplayDate(dateStr, { includeYear: false, shortMonth: true });
}

export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Add days to a start date.
 * If workingDaysOnly is true, Saturday and Sunday are skipped.
 */
export function addDays(startDateStr: string, days: number, workingDaysOnly: boolean = false): string {
  let date = parseISODate(startDateStr);
  
  if (!workingDaysOnly) {
    date.setUTCDate(date.getUTCDate() + days);
    return formatISODate(date);
  }

  // Working days addition
  let remaining = days;
  const direction = days >= 0 ? 1 : -1;
  remaining = Math.abs(remaining);

  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + direction);
    if (!isWeekend(date)) {
      remaining--;
    }
  }

  return formatISODate(date);
}

/**
 * Calculate difference in days between two dates.
 */
export function daysBetween(startDateStr: string, endDateStr: string, workingDaysOnly: boolean = false): number {
  const start = parseISODate(startDateStr);
  const end = parseISODate(endDateStr);

  if (!workingDaysOnly) {
    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  // Count working days between
  let count = 0;
  const cur = new Date(start);
  const target = new Date(end);
  const isForward = target >= cur;

  while (isForward ? cur < target : cur > target) {
    cur.setUTCDate(cur.getUTCDate() + (isForward ? 1 : -1));
    if (!isWeekend(cur)) {
      count += isForward ? 1 : -1;
    }
  }

  return count;
}

/**
 * Returns an array of day labels or date points for timeline rendering.
 */
export function generateTimelineDates(startDateStr: string, totalDays: number, workingDaysOnly: boolean = false): string[] {
  const dates: string[] = [];
  let cur = startDateStr;
  
  for (let i = 0; i <= totalDays; i++) {
    dates.push(cur);
    cur = addDays(cur, 1, workingDaysOnly);
  }
  
  return dates;
}
