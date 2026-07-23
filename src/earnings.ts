import { ShiftEntry } from "./types";

export const WEEKLY_ACCOUNT_FEE = 325;
export const ACCOUNT_FEE_START_WEEK = "2026-07-27";

export const getWeekStartKey = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);
  const daysSinceMonday = (localDate.getDay() + 6) % 7;
  localDate.setDate(localDate.getDate() - daysSinceMonday);

  return [
    localDate.getFullYear(),
    String(localDate.getMonth() + 1).padStart(2, "0"),
    String(localDate.getDate()).padStart(2, "0"),
  ].join("-");
};

const addDays = (date: string, days: number) => {
  const [year, month, day] = date.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);
  localDate.setDate(localDate.getDate() + days);

  return [
    localDate.getFullYear(),
    String(localDate.getMonth() + 1).padStart(2, "0"),
    String(localDate.getDate()).padStart(2, "0"),
  ].join("-");
};

const getLocalDateKey = (date: Date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, "0"),
  String(date.getDate()).padStart(2, "0"),
].join("-");

export interface WeeklySettlement {
  weekStart: string;
  weekEnd: string;
  nextMonday: string;
  totalGross: number;
  totalCash: number;
  totalExpenses: number;
  totalNetBeforeFee: number;
  fee: number;
  totalAfterFee: number;
  daysWorked: number;
}

export const getCompletedWeeklySettlements = (
  entries: ShiftEntry[],
  today = new Date(),
): WeeklySettlement[] => {
  const todayKey = getLocalDateKey(today);
  const weeks = new Map<string, ShiftEntry[]>();

  entries.forEach((entry) => {
    const weekStart = getWeekStartKey(entry.date);
    if (weekStart < ACCOUNT_FEE_START_WEEK) return;
    weeks.set(weekStart, [...(weeks.get(weekStart) ?? []), entry]);
  });

  return [...weeks.entries()]
    .map(([weekStart, weekEntries]) => {
      const nextMonday = addDays(weekStart, 7);
      const totalGross = weekEntries.reduce((sum, entry) => sum + entry.grossEarnings, 0);
      const totalCash = weekEntries.reduce((sum, entry) => sum + entry.cashEarnings, 0);
      const totalExpenses = 0;
      const totalNetBeforeFee = totalGross;
      return {
        weekStart,
        weekEnd: addDays(weekStart, 6),
        nextMonday,
        totalGross,
        totalCash,
        totalExpenses,
        totalNetBeforeFee,
        fee: WEEKLY_ACCOUNT_FEE,
        totalAfterFee: totalNetBeforeFee - WEEKLY_ACCOUNT_FEE,
        daysWorked: weekEntries.length,
      };
    })
    .filter((week) => week.nextMonday <= todayKey)
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart));
};
