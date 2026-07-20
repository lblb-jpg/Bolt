import { supabase, supabaseConfigured } from "./supabase";
import { ShiftEntry } from "./types";

const TABLE_NAME = "bolt_shifts";

type ShiftRow = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  initial_balance: number | string;
  final_balance: number | string;
  gross_earnings: number | string;
  expenses: number | string;
  net_earnings: number | string;
  notes: string | null;
  created_at: number | string;
};

const getLocalEntries = (): ShiftEntry[] => {
  const data = localStorage.getItem(TABLE_NAME);
  if (!data) return [];

  try {
    return JSON.parse(data);
  } catch (error) {
    console.error("Impossible de lire les données locales :", error);
    return [];
  }
};

const saveLocalEntries = (entries: ShiftEntry[]) => {
  localStorage.setItem(TABLE_NAME, JSON.stringify(entries));
};

const sortEntries = (entries: ShiftEntry[]) =>
  entries.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

const fromRow = (row: ShiftRow): ShiftEntry => ({
  id: row.id,
  date: row.date,
  startTime: row.start_time.slice(0, 5),
  endTime: row.end_time.slice(0, 5),
  initialBalance: Number(row.initial_balance),
  finalBalance: Number(row.final_balance),
  grossEarnings: Number(row.gross_earnings),
  expenses: Number(row.expenses),
  netEarnings: Number(row.net_earnings),
  notes: row.notes ?? "",
  createdAt: Number(row.created_at),
});

const toRow = (entry: Omit<ShiftEntry, "id">) => ({
  date: entry.date,
  start_time: entry.startTime,
  end_time: entry.endTime,
  initial_balance: entry.initialBalance,
  final_balance: entry.finalBalance,
  gross_earnings: entry.grossEarnings,
  expenses: entry.expenses,
  net_earnings: entry.netEarnings,
  notes: entry.notes ?? "",
  created_at: entry.createdAt,
});

const toUpdateRow = (updates: Partial<Omit<ShiftEntry, "id" | "createdAt">>) => ({
  ...(updates.date !== undefined && { date: updates.date }),
  ...(updates.startTime !== undefined && { start_time: updates.startTime }),
  ...(updates.endTime !== undefined && { end_time: updates.endTime }),
  ...(updates.initialBalance !== undefined && { initial_balance: updates.initialBalance }),
  ...(updates.finalBalance !== undefined && { final_balance: updates.finalBalance }),
  ...(updates.grossEarnings !== undefined && { gross_earnings: updates.grossEarnings }),
  ...(updates.expenses !== undefined && { expenses: updates.expenses }),
  ...(updates.netEarnings !== undefined && { net_earnings: updates.netEarnings }),
  ...(updates.notes !== undefined && { notes: updates.notes }),
});

export const dbService = {
  async getEntries(): Promise<ShiftEntry[]> {
    if (!supabaseConfigured || !supabase) {
      return sortEntries(getLocalEntries());
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur Supabase pendant la lecture, utilisation du cache local :", error);
      return sortEntries(getLocalEntries());
    }

    const entries = (data as ShiftRow[]).map(fromRow);
    saveLocalEntries(entries);
    return entries;
  },

  async addEntry(entry: Omit<ShiftEntry, "id">): Promise<ShiftEntry> {
    const localEntries = getLocalEntries();
    const temporaryEntry: ShiftEntry = { ...entry, id: `temp_${Date.now()}` };

    if (!supabaseConfigured || !supabase) {
      saveLocalEntries([temporaryEntry, ...localEntries]);
      return temporaryEntry;
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(toRow(entry))
      .select("*")
      .single();

    if (error) {
      console.error("Erreur Supabase pendant l'ajout, sauvegarde locale :", error);
      saveLocalEntries([temporaryEntry, ...localEntries]);
      return temporaryEntry;
    }

    const createdEntry = fromRow(data as ShiftRow);
    saveLocalEntries([createdEntry, ...localEntries]);
    return createdEntry;
  },

  async updateEntry(
    id: string,
    entryUpdates: Partial<Omit<ShiftEntry, "id" | "createdAt">>,
  ): Promise<void> {
    const localEntries = getLocalEntries();
    const index = localEntries.findIndex((entry) => entry.id === id);
    if (index !== -1) {
      localEntries[index] = { ...localEntries[index], ...entryUpdates };
      saveLocalEntries(localEntries);
    }

    if (!supabaseConfigured || !supabase || id.startsWith("temp_")) return;

    const { error } = await supabase.from(TABLE_NAME).update(toUpdateRow(entryUpdates)).eq("id", id);
    if (error) console.error("Erreur Supabase pendant la modification :", error);
  },

  async deleteEntry(id: string): Promise<void> {
    saveLocalEntries(getLocalEntries().filter((entry) => entry.id !== id));

    if (!supabaseConfigured || !supabase || id.startsWith("temp_")) return;

    const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);
    if (error) console.error("Erreur Supabase pendant la suppression :", error);
  },
};
