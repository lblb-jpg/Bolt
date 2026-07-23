export type PaymentMethod = "card" | "cash";

export interface RideEntry {
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface ShiftEntry {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  initialBalance: number; // Solde au début de ma journée (ex. 75€)
  finalBalance: number; // Solde à la fin de ma journée (ex. 220€)
  cashRides: number[]; // Montant brut de chaque course réglée en espèces
  rides: RideEntry[]; // Toutes les courses, avec leur mode de paiement
  cashEarnings: number; // Total espèces conservé après la déduction de 24 %
  grossEarnings: number; // Solde final - solde initial + espèces après déduction
  expenses: number; // Dépenses / Carburant (ex. 15€)
  netEarnings: number; // Gains bruts - Dépenses (ex. 130€)
  notes?: string;
  createdAt: number;
}

export interface EarningsStats {
  totalGross: number;
  totalCash: number;
  totalCashGross: number;
  totalNet: number;
  totalExpenses: number;
  daysCount: number;
  averageNetPerDay: number;
  maxNetDay: { date: string; amount: number } | null;
}
