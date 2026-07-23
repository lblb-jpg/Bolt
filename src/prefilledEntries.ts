import { ShiftEntry } from "./types";

const makeEntry = (
  date: string,
  startTime: string,
  endTime: string,
  cashAmounts: number[],
  cardAmounts: number[],
  cashEarnings: number,
  grossEarnings: number,
): Omit<ShiftEntry, "id"> => ({
  date,
  startTime,
  endTime,
  initialBalance: 0,
  finalBalance: 0,
  rides: [
    ...cashAmounts.map((amount) => ({ amount, paymentMethod: "cash" as const })),
    ...cardAmounts.map((amount) => ({ amount, paymentMethod: "card" as const })),
  ],
  cashRides: cashAmounts,
  cashEarnings,
  grossEarnings,
  expenses: 0,
  netEarnings: grossEarnings,
  notes: `Horaires : ${startTime.replace(":", "h")} – ${endTime.replace(":", "h")}`,
  createdAt: new Date(`${date}T${endTime}:00`).getTime(),
});

export const PREFILLED_JULY_ENTRIES: Array<Omit<ShiftEntry, "id">> = [
  makeEntry(
    "2026-07-20",
    "13:00",
    "20:22",
    [18.62, 14.82, 26.14, 13.68],
    [9.12, 13, 18.32, 14.29, 10.11],
    55.68,
    120.52,
  ),
  makeEntry(
    "2026-07-21",
    "14:39",
    "19:04",
    [9.12, 10.87, 18.01, 9.12],
    [10.03, 9.12, 10.56],
    35.81,
    65.52,
  ),
  makeEntry(
    "2026-07-22",
    "03:13",
    "11:00",
    [11.7, 9.12, 12.01, 15.66, 20.29],
    [13.45, 9.12, 13.68, 23.56, 10.03],
    52.27,
    122.11,
  ),
];
