import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  isSameDay as dfnIsSameDay,
  isSameMonth as dfnIsSameMonth,
  format,
  isToday as dfnIsToday,
  parseISO,
} from 'date-fns';
import { SchoolYear } from '../types';

export const HEBREW_MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

// School year month order: Sep=8, Oct=9, ..., Aug=7
export const SCHOOL_YEAR_MONTH_NAMES = [
  'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט',
];

export const HEBREW_DAY_NAMES_SHORT = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
export const HEBREW_DAY_NAMES_FULL = [
  'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת',
];

export function getMonthName(monthIndex: number): string {
  return HEBREW_MONTH_NAMES[monthIndex] ?? '';
}

export function getMonthsInSchoolYear(year: SchoolYear): Date[] {
  const months: Date[] = [];
  // Sep (month 8) through Aug (month 7) of next year
  const startYear = parseInt(year.startDate.split('-')[0]);
  // Sep - Dec of start year
  for (let m = 8; m <= 11; m++) {
    months.push(new Date(startYear, m, 1));
  }
  // Jan - Aug of end year
  for (let m = 0; m <= 7; m++) {
    months.push(new Date(startYear + 1, m, 1));
  }
  return months;
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 0 }); // 0 = Sunday
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** The upcoming school week: next Sunday → next Thursday (relative to `from`). */
export function getNextWeekRange(from: Date = new Date()): { start: Date; end: Date } {
  const thisSunday = startOfWeek(from, { weekStartsOn: 0 });
  const nextSunday = addDays(thisSunday, 7);
  return { start: nextSunday, end: addDays(nextSunday, 4) }; // Sun … Thu
}

/** The 5 school days (Sun–Thu) of the upcoming week. */
export function getNextWeekDays(from: Date = new Date()): Date[] {
  const { start } = getNextWeekRange(from);
  return Array.from({ length: 5 }, (_, i) => addDays(start, i));
}

export function getMonthGrid(date: Date): Date[][] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Ensure exactly 6 weeks (42 days)
  while (allDays.length < 42) {
    allDays.push(addDays(allDays[allDays.length - 1], 1));
  }

  const grid: Date[][] = [];
  for (let i = 0; i < 6; i++) {
    grid.push(allDays.slice(i * 7, (i + 1) * 7));
  }
  return grid;
}

export function formatHebrewDate(date: Date): string {
  const dayName = HEBREW_DAY_NAMES_FULL[date.getDay()];
  const dayNum = date.getDate();
  const monthName = HEBREW_MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `יום ${dayName}, ${dayNum} ב${monthName} ${year}`;
}

export function formatHebrewShortDate(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

export function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return format(date, 'HH:mm');
  } catch {
    return '';
  }
}

export function isToday(date: Date): boolean {
  return dfnIsToday(date);
}

export function isSameDay(a: Date, b: Date): boolean {
  return dfnIsSameDay(a, b);
}

export function isSameMonth(a: Date, b: Date): boolean {
  return dfnIsSameMonth(a, b);
}

export function getSchoolYearForDate(date: Date, years: SchoolYear[]): SchoolYear | undefined {
  return years.find((y) => {
    const start = parseISO(y.startDate);
    const end = parseISO(y.endDate);
    return date >= start && date <= end;
  });
}

export function formatDateRange(startDate: Date, endDate: Date, view: string): string {
  if (view === 'day') {
    return formatHebrewDate(startDate);
  }
  if (view === 'week') {
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const startMonth = HEBREW_MONTH_NAMES[startDate.getMonth()];
    const endMonth = HEBREW_MONTH_NAMES[endDate.getMonth()];
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    if (startDate.getMonth() === endDate.getMonth() && startYear === endYear) {
      return `${startDay}–${endDay} ב${startMonth} ${startYear}`;
    }
    if (startYear === endYear) {
      return `${startDay} ב${startMonth} – ${endDay} ב${endMonth} ${startYear}`;
    }
    return `${startDay} ב${startMonth} ${startYear} – ${endDay} ב${endMonth} ${endYear}`;
  }
  if (view === 'month') {
    return `${HEBREW_MONTH_NAMES[startDate.getMonth()]} ${startDate.getFullYear()}`;
  }
  if (view === 'year') {
    return `שנת לימודים ${startDate.getFullYear()}–${startDate.getFullYear() + 1}`;
  }
  return format(startDate, 'dd/MM/yyyy');
}
