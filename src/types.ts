export interface ShiftEntry {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  initialBalance: number; // Solde au début de ma journée (ex. 75€)
  finalBalance: number; // Solde à la fin de ma journée (ex. 220€)
  grossEarnings: number; // Solde final - Solde initial (ex. 145€)
  expenses: number; // Dépenses / Carburant (ex. 15€)
  netEarnings: number; // Gains bruts - Dépenses (ex. 130€)
  notes?: string;
  createdAt: number;
}

export interface EarningsStats {
  totalGross: number;
  totalNet: number;
  totalExpenses: number;
  daysCount: number;
  averageNetPerDay: number;
  maxNetDay: { date: string; amount: number } | null;
}
