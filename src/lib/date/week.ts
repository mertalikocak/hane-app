import type { DayOfWeek } from "@/types/common";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseDate(value: string): Date | null {
  if (!DATE_PATTERN.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || formatDate(date) !== value ? null : date;
}

export function getWeekStart(date: Date): Date {
  const day = date.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return monday;
}

export function getCurrentWeekStart(): string {
  return formatDate(getWeekStart(new Date()));
}

export function getValidWeekStart(value: string | undefined): string {
  const date = value ? parseDate(value) : null;
  if (!date) return getCurrentWeekStart();
  return formatDate(getWeekStart(date));
}

export function addWeeks(weekStart: string, amount: number): string {
  const date = parseDate(weekStart) ?? getWeekStart(new Date());
  date.setUTCDate(date.getUTCDate() + amount * 7);
  return formatDate(date);
}

export function getDateForDay(weekStart: string, day: DayOfWeek): string {
  const date = parseDate(weekStart) ?? getWeekStart(new Date());
  date.setUTCDate(date.getUTCDate() + day - 1);
  return formatDate(date);
}
