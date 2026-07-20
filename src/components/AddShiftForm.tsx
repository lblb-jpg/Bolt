import React, { useState, useEffect } from "react";
import { PlusCircle, Save, X, Calendar, Euro, AlertCircle } from "lucide-react";
import { ShiftEntry } from "../types";

interface AddShiftFormProps {
  onSave: (entry: Omit<ShiftEntry, "id" | "createdAt">) => void;
  editingEntry: ShiftEntry | null;
  onCancelEdit: () => void;
}

export const AddShiftForm: React.FC<AddShiftFormProps> = ({
  onSave,
  editingEntry,
  onCancelEdit,
}) => {
  // Form States
  const [date, setDate] = useState<string>("");
  const [initialBalance, setInitialBalance] = useState<string>("");
  const [finalBalance, setFinalBalance] = useState<string>("");
  const [expenses, setExpenses] = useState<string>("0");
  const [notes, setNotes] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set default values or editing values
  useEffect(() => {
    if (editingEntry) {
      setDate(editingEntry.date);
      setInitialBalance(editingEntry.initialBalance.toString());
      setFinalBalance(editingEntry.finalBalance.toString());
      setExpenses(editingEntry.expenses.toString());
      setNotes(editingEntry.notes || "");
      setErrorMessage(null);
    } else {
      // Default to today's date in local time zone
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - offset * 60 * 1000);
      setDate(localToday.toISOString().split("T")[0]);
      
      setInitialBalance("");
      setFinalBalance("");
      setExpenses("0");
      setNotes("");
      setErrorMessage(null);
    }
  }, [editingEntry]);

  // Clean parsing helper
  const parseNum = (val: string): number => {
    const cleaned = val.replace(",", ".");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Live calculations
  const initBalNum = parseNum(initialBalance);
  const finBalNum = parseNum(finalBalance);
  const expNum = parseNum(expenses);

  const calculatedGross = Math.max(0, finBalNum - initBalNum);
  const calculatedNet = Math.max(0, calculatedGross - expNum);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!date) {
      setErrorMessage("Veuillez sélectionner une date.");
      return;
    }
    if (initialBalance === "" || finalBalance === "") {
      setErrorMessage("Veuillez saisir le solde initial et le solde final.");
      return;
    }

    const init = parseNum(initialBalance);
    const final = parseNum(finalBalance);
    
    if (final < init) {
      if (!confirm("Le solde final est inférieur au solde initial. Enregistrer quand même ?")) {
        return;
      }
    }

    const gross = final - init;
    const exp = parseNum(expenses);
    const net = gross - exp;

    onSave({
      date,
      startTime: "10:00",
      endTime: "18:00",
      initialBalance: init,
      finalBalance: final,
      grossEarnings: gross,
      expenses: exp,
      netEarnings: net,
      notes: notes.trim(),
    });

    // Reset if we were not editing
    if (!editingEntry) {
      setInitialBalance("");
      setFinalBalance("");
      setExpenses("0");
      setNotes("");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <div className="bg-[#16191F] border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl shadow-black/10 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <PlusCircle className={`h-5 w-5 ${editingEntry ? "text-amber-400" : "text-emerald-400"}`} />
          <h2 className="text-lg font-bold text-white">
            {editingEntry ? "Modifier la journée" : "Enregistrer une journée"}
          </h2>
        </div>
        {editingEntry && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5"
            id="cancel-edit-btn"
          >
            <X className="h-3.5 w-3.5" />
            <span>Annuler</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" id="shift-entry-form">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Inputs - 2 columns on mobile, 4 columns on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-emerald-500" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#0F1115] border border-white/10 rounded-xl px-2.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all [color-scheme:dark]"
              required
              id="input-shift-date"
            />
          </div>

          {/* Initial Balance */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Euro className="h-3.5 w-3.5 text-amber-500" />
              Solde début
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                placeholder="Ex. 75.00"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full bg-[#0F1115] border border-white/10 rounded-xl pl-3 pr-7 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                required
                id="input-shift-initial-balance"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-semibold">
                €
              </span>
            </div>
          </div>

          {/* Final Balance */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Euro className="h-3.5 w-3.5 text-emerald-500" />
              Fin (Départ)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                placeholder="Ex. 220.00"
                value={finalBalance}
                onChange={(e) => setFinalBalance(e.target.value)}
                className="w-full bg-[#0F1115] border border-white/10 rounded-xl pl-3 pr-7 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                required
                id="input-shift-final-balance"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-semibold">
                €
              </span>
            </div>
          </div>

          {/* Expenses */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Euro className="h-3.5 w-3.5 text-rose-500" />
              Frais / Carbu
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                placeholder="Ex. 15.00"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                className="w-full bg-[#0F1115] border border-white/10 rounded-xl pl-3 pr-7 py-2.5 text-xs sm:text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                id="input-shift-expenses"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-semibold">
                €
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Notes / Observations (Optionnel)
          </label>
          <input
            type="text"
            placeholder="Ex. Conditions fluides, bonus Bolt de la journée..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[#0F1115] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
            id="input-shift-notes"
          />
        </div>

        {/* Compact live result */}
        <div className="pt-1 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 flex items-center justify-between rounded-xl bg-[#0F1115] border border-white/5 px-4 py-3">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Gain {expNum > 0 ? "net" : "brut"}
              </span>
              {expNum > 0 && (
                <span className="text-[10px] text-gray-500">Frais déduits : {formatCurrency(expNum)}</span>
              )}
            </div>
            <strong className={`text-lg font-mono ${expNum > 0 ? "text-emerald-400" : "text-amber-400"}`}>
              {formatCurrency(expNum > 0 ? calculatedNet : calculatedGross)}
            </strong>
          </div>

          <button
            type="submit"
            className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              editingEntry
                ? "bg-amber-500 hover:bg-amber-400 text-[#0F1115] shadow-amber-500/10 active:scale-95"
                : "bg-emerald-500 hover:bg-emerald-400 text-[#0F1115] shadow-lg shadow-emerald-500/10 active:scale-95"
            }`}
            id="save-shift-submit-btn"
          >
            <Save className="h-4 w-4" />
            <span>{editingEntry ? "Mettre à jour" : "Enregistrer"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
