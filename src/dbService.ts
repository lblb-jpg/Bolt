import { supabase, supabaseConfigured } from "./supabase";
import { ShiftEntry } from "./types";
import { UserProfile } from "./profileSession";

const TABLE_NAME = "bolt_shifts";
const LEGACY_CASH_NOTE_PREFIX = /^\[myshift_cash=(-?\d+(?:\.\d+)?)\]\n?/;
const CASH_RIDES_NOTE_PREFIX = /^\[myshift_cash_rides=([\d.,-]*);net=(-?\d+(?:\.\d+)?)\]\n?/;
const PROFILE_NOTE_PREFIX = /^\[myshift_profile=(principal|elyesse)\]\n?/;

type ShiftRow = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  initial_balance: number | string;
  final_balance: number | string;
  cash_earnings?: number | string | null;
  cash_rides?: Array<number | string> | null;
  profile_id?: UserProfile["id"] | null;
  gross_earnings: number | string;
  expenses: number | string;
  net_earnings: number | string;
  notes: string | null;
  created_at: number | string;
};

const localStorageKey = (profileId: UserProfile["id"]) => `${TABLE_NAME}:${profileId}`;

const getLocalEntries = (profileId: UserProfile["id"]): ShiftEntry[] => {
  const data = localStorage.getItem(localStorageKey(profileId))
    ?? (profileId === "principal" ? localStorage.getItem(TABLE_NAME) : null);
  if (!data) return [];

  try {
    return (JSON.parse(data) as ShiftEntry[]).map((entry) => ({
      ...entry,
      cashRides: Array.isArray(entry.cashRides) ? entry.cashRides.map(Number) : [],
      cashEarnings: Number(entry.cashEarnings ?? 0),
    }));
  } catch (error) {
    console.error("Impossible de lire les données locales :", error);
    return [];
  }
};

const saveLocalEntries = (profileId: UserProfile["id"], entries: ShiftEntry[]) => {
  localStorage.setItem(localStorageKey(profileId), JSON.stringify(entries));
};

const sortEntries = (entries: ShiftEntry[]) =>
  entries.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

const parseCashNote = (notes: string) => {
  const cleanNotes = notes.replace(PROFILE_NOTE_PREFIX, "");
  const ridesMatch = cleanNotes.match(CASH_RIDES_NOTE_PREFIX);
  const legacyMatch = cleanNotes.match(LEGACY_CASH_NOTE_PREFIX);
  return {
    cashRides: ridesMatch?.[1]
      ? ridesMatch[1].split(",").map(Number).filter((amount) => Number.isFinite(amount) && amount > 0)
      : [],
    cashEarnings: ridesMatch ? Number(ridesMatch[2]) : legacyMatch ? Number(legacyMatch[1]) : 0,
    notes: cleanNotes.replace(CASH_RIDES_NOTE_PREFIX, "").replace(LEGACY_CASH_NOTE_PREFIX, ""),
  };
};

const getRowProfileId = (row: ShiftRow): UserProfile["id"] =>
  row.profile_id ?? (row.notes?.match(PROFILE_NOTE_PREFIX)?.[1] as UserProfile["id"] | undefined) ?? "principal";

const encodeProfileNote = (profileId: UserProfile["id"], notes: string) =>
  `[myshift_profile=${profileId}]\n${notes}`;

const encodeCashNote = (cashRides: number[], cashEarnings: number, notes: string) =>
  cashEarnings > 0
    ? `[myshift_cash_rides=${cashRides.join(",")};net=${cashEarnings}]\n${notes}`
    : notes;

const isMissingCashColumnError = (error: { code?: string; message?: string } | null) =>
  Boolean(error && (
    error.code === "PGRST204"
    || error.code === "42703"
    || error.message?.includes("cash_earnings")
    || error.message?.includes("cash_rides")
    || error.message?.includes("profile_id")
  ));

const fromRow = (row: ShiftRow): ShiftEntry => {
  const parsedNotes = parseCashNote(row.notes ?? "");
  return {
    id: row.id,
    date: row.date,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    initialBalance: Number(row.initial_balance),
    finalBalance: Number(row.final_balance),
    cashRides: row.cash_rides?.length
      ? row.cash_rides.map(Number)
      : parsedNotes.cashRides,
    cashEarnings: Number(row.cash_earnings ?? 0) || parsedNotes.cashEarnings,
    grossEarnings: Number(row.gross_earnings),
    expenses: Number(row.expenses),
    netEarnings: Number(row.net_earnings),
    notes: parsedNotes.notes,
    createdAt: Number(row.created_at),
  };
};

const toRow = (profileId: UserProfile["id"], entry: Omit<ShiftEntry, "id">) => ({
  profile_id: profileId,
  date: entry.date,
  start_time: entry.startTime,
  end_time: entry.endTime,
  initial_balance: entry.initialBalance,
  final_balance: entry.finalBalance,
  cash_rides: entry.cashRides,
  cash_earnings: entry.cashEarnings,
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
  ...(updates.cashRides !== undefined && { cash_rides: updates.cashRides }),
  ...(updates.cashEarnings !== undefined && { cash_earnings: updates.cashEarnings }),
  ...(updates.grossEarnings !== undefined && { gross_earnings: updates.grossEarnings }),
  ...(updates.expenses !== undefined && { expenses: updates.expenses }),
  ...(updates.netEarnings !== undefined && { net_earnings: updates.netEarnings }),
  ...(updates.notes !== undefined && { notes: updates.notes }),
});

const toLegacyRow = (profileId: UserProfile["id"], entry: Omit<ShiftEntry, "id">) => {
  const { cash_earnings: _cashEarnings, cash_rides: _cashRides, profile_id: _profileId, ...row } = toRow(profileId, entry);
  return { ...row, notes: encodeProfileNote(profileId, encodeCashNote(entry.cashRides, entry.cashEarnings, entry.notes ?? "")) };
};

const toLegacyUpdateRow = (profileId: UserProfile["id"], updates: Partial<Omit<ShiftEntry, "id" | "createdAt">>) => {
  const { cash_earnings: _cashEarnings, cash_rides: _cashRides, ...row } = toUpdateRow(updates);
  if (updates.cashRides === undefined && updates.cashEarnings === undefined && updates.notes === undefined) return row;
  return {
    ...row,
    notes: encodeProfileNote(profileId, encodeCashNote(updates.cashRides ?? [], updates.cashEarnings ?? 0, updates.notes ?? "")),
  };
};

export const dbService = {
  async getEntries(profileId: UserProfile["id"]): Promise<ShiftEntry[]> {
    if (!supabaseConfigured || !supabase) {
      return sortEntries(getLocalEntries(profileId));
    }

    let { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("profile_id", profileId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (isMissingCashColumnError(error)) {
      const legacyResult = await supabase
        .from(TABLE_NAME)
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      data = legacyResult.data?.filter((row) => getRowProfileId(row as ShiftRow) === profileId) ?? null;
      error = legacyResult.error;
    }

    if (error) {
      console.error("Erreur Supabase pendant la lecture, utilisation du cache local :", error);
      return sortEntries(getLocalEntries(profileId));
    }

    const entries = (data as ShiftRow[]).map(fromRow);
    saveLocalEntries(profileId, entries);
    return entries;
  },

  async addEntry(profileId: UserProfile["id"], entry: Omit<ShiftEntry, "id">): Promise<ShiftEntry> {
    const localEntries = getLocalEntries(profileId);
    const temporaryEntry: ShiftEntry = { ...entry, id: `temp_${Date.now()}` };

    if (!supabaseConfigured || !supabase) {
      saveLocalEntries(profileId, [temporaryEntry, ...localEntries]);
      return temporaryEntry;
    }

    let { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(toRow(profileId, entry))
      .select("*")
      .single();

    if (isMissingCashColumnError(error)) {
      const legacyResult = await supabase
        .from(TABLE_NAME)
        .insert(toLegacyRow(profileId, entry))
        .select("*")
        .single();
      data = legacyResult.data;
      error = legacyResult.error;
    }

    if (error) {
      console.error("Erreur Supabase pendant l'ajout, sauvegarde locale :", error);
      saveLocalEntries(profileId, [temporaryEntry, ...localEntries]);
      return temporaryEntry;
    }

    const createdEntry = fromRow(data as ShiftRow);
    saveLocalEntries(profileId, [createdEntry, ...localEntries]);
    return createdEntry;
  },

  async updateEntry(
    profileId: UserProfile["id"],
    id: string,
    entryUpdates: Partial<Omit<ShiftEntry, "id" | "createdAt">>,
  ): Promise<void> {
    const localEntries = getLocalEntries(profileId);
    const index = localEntries.findIndex((entry) => entry.id === id);
    if (index !== -1) {
      localEntries[index] = { ...localEntries[index], ...entryUpdates };
      saveLocalEntries(profileId, localEntries);
    }

    if (!supabaseConfigured || !supabase || id.startsWith("temp_")) return;

    let { error } = await supabase
      .from(TABLE_NAME)
      .update(toUpdateRow(entryUpdates))
      .eq("id", id)
      .eq("profile_id", profileId);
    if (isMissingCashColumnError(error)) {
      const legacyResult = await supabase.from(TABLE_NAME).update(toLegacyUpdateRow(profileId, entryUpdates)).eq("id", id);
      error = legacyResult.error;
    }
    if (error) console.error("Erreur Supabase pendant la modification :", error);
  },

  async deleteEntry(profileId: UserProfile["id"], id: string): Promise<void> {
    saveLocalEntries(profileId, getLocalEntries(profileId).filter((entry) => entry.id !== id));

    if (!supabaseConfigured || !supabase || id.startsWith("temp_")) return;

    let { error } = await supabase.from(TABLE_NAME).delete().eq("id", id).eq("profile_id", profileId);
    if (isMissingCashColumnError(error)) {
      const legacyResult = await supabase.from(TABLE_NAME).delete().eq("id", id);
      error = legacyResult.error;
    }
    if (error) console.error("Erreur Supabase pendant la suppression :", error);
  },
};
