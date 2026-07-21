import React, { useState, useEffect } from "react";
import { PlusCircle, Save, X, Calendar, Euro, AlertCircle, Target, CheckCircle2, Banknote, Plus, Trash2 } from "lucide-react";
import { ShiftEntry } from "../types";

const DAILY_EARNINGS_TARGET = 200;
const CASH_COMMISSION_RATE = 0.24;

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
  const [cashRides, setCashRides] = useState<string[]>([""]);
  const [expenses, setExpenses] = useState<string>("0");
  const [notes, setNotes] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set default values or editing values
  useEffect(() => {
    if (editingEntry) {
      setDate(editingEntry.date);
      setInitialBalance(editingEntry.initialBalance.toString());
      setFinalBalance(editingEntry.finalBalance.toString());
      setCashRides(
        editingEntry.cashRides?.length
          ? editingEntry.cashRides.map(String)
          : editingEntry.cashEarnings > 0
            ? [(editingEntry.cashEarnings / (1 - CASH_COMMISSION_RATE)).toFixed(2)]
            : [""],
      );
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
      setCashRides([""]);
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

  const retainedCashForRide = (amount: number) => Math.round(amount * (1 - CASH_COMMISSION_RATE) * 100) / 100;

  // Live calculations
  const initBalNum = parseNum(initialBalance);
  const finBalNum = parseNum(finalBalance);
  const cashRideAmounts = cashRides.map(parseNum).filter((amount) => amount > 0);
  const cashGross = cashRideAmounts.reduce((sum, amount) => sum + amount, 0);
  const cashNum = cashRideAmounts.reduce((sum, amount) => sum + retainedCashForRide(amount), 0);
  const cashDeduction = Math.round((cashGross - cashNum) * 100) / 100;
  const expNum = parseNum(expenses);

  const calculatedGross = Math.max(0, finBalNum - initBalNum + cashNum);
  const calculatedNet = Math.max(0, calculatedGross - expNum);
  const targetFinalBalance = Math.max(0, initBalNum + DAILY_EARNINGS_TARGET - cashNum);
  const remainingToTarget = Math.max(0, DAILY_EARNINGS_TARGET - calculatedGross);
  const targetProgress = Math.min(100, (calculatedGross / DAILY_EARNINGS_TARGET) * 100);
  const targetReached = finalBalance !== "" && calculatedGross >= DAILY_EARNINGS_TARGET;

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
    const rides = cashRides.map(parseNum).filter((amount) => amount > 0);
    const cash = rides.reduce((sum, amount) => sum + retainedCashForRide(amount), 0);
    
    if (final - init + cash < 0) {
      if (!confirm("Le total avec les espèces est négatif. Enregistrer quand même ?")) {
        return;
      }
    }

    const gross = final - init + cash;
    const exp = parseNum(expenses);
    const net = gross - exp;

    onSave({
      date,
      startTime: "10:00",
      endTime: "18:00",
      initialBalance: init,
      finalBalance: final,
      cashRides: rides,
      cashEarnings: cash,
      grossEarnings: gross,
      expenses: exp,
      netEarnings: net,
      notes: notes.trim(),
    });

    // Reset if we were not editing
    if (!editingEntry) {
      setInitialBalance("");
      setFinalBalance("");
      setCashRides([""]);
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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
              className="min-h-12 w-full rounded-xl border border-white/10 bg-[#0F1115] px-3 text-base text-white transition-all [color-scheme:dark] focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 sm:text-sm"
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
                className="min-h-12 w-full rounded-xl border border-white/10 bg-[#0F1115] pl-3 pr-8 font-mono text-base text-white transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 sm:text-sm"
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
                className="min-h-12 w-full rounded-xl border border-white/10 bg-[#0F1115] pl-3 pr-8 font-mono text-base text-white transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 sm:text-sm"
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
                className="min-h-12 w-full rounded-xl border border-white/10 bg-[#0F1115] pl-3 pr-8 font-mono text-base text-white transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 sm:text-sm"
                id="input-shift-expenses"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-semibold">
                €
              </span>
            </div>
          </div>

        </div>

        <div className="rounded-xl border border-sky-500/10 bg-sky-500/[0.035] p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-sky-400" />
              <div>
                <h3 className="text-xs font-bold text-white">Courses en espèces</h3>
                <p className="mt-0.5 text-[9px] text-zinc-500">24 % déduits sur chaque course</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCashRides((rides) => [...rides, ""])}
              className="flex min-h-9 items-center gap-1.5 rounded-lg border border-sky-500/15 bg-sky-500/10 px-2.5 text-[10px] font-bold text-sky-400 transition active:scale-95"
              id="add-cash-ride-btn"
            >
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </button>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {cashRides.map((ride, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <label htmlFor={`input-cash-ride-${index}`} className="block text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
                    Course {index + 1}
                  </label>
                  <div className="relative">
                    <input
                      id={`input-cash-ride-${index}`}
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*[.,]?[0-9]*"
                      placeholder="Montant"
                      value={ride}
                      onChange={(event) => setCashRides((rides) => rides.map((value, rideIndex) => rideIndex === index ? event.target.value : value))}
                      className="min-h-11 w-full rounded-lg border border-white/10 bg-[#0F1115] pl-3 pr-8 font-mono text-base text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10 sm:text-sm"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-600">€</span>
                  </div>
                </div>
                {cashRides.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setCashRides((rides) => rides.filter((_, rideIndex) => rideIndex !== index))}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-[#0F1115] text-zinc-500 transition hover:text-rose-400 active:scale-95"
                    aria-label={`Supprimer la course ${index + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {cashGross > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-sky-500/10 pt-3 text-center">
              <div>
                <span className="block text-[8px] uppercase text-zinc-600">Total brut</span>
                <strong className="mt-0.5 block font-mono text-[11px] text-zinc-300">{formatCurrency(cashGross)}</strong>
              </div>
              <div>
                <span className="block text-[8px] uppercase text-zinc-600">Déduction 24 %</span>
                <strong className="mt-0.5 block font-mono text-[11px] text-rose-400">-{formatCurrency(cashDeduction)}</strong>
              </div>
              <div>
                <span className="block text-[8px] uppercase text-zinc-600">Espèces retenues</span>
                <strong className="mt-0.5 block font-mono text-[11px] text-sky-400">{formatCurrency(cashNum)}</strong>
              </div>
            </div>
          )}
        </div>

        {initialBalance !== "" && (
          <div
            className={`rounded-xl border px-3.5 py-3 transition-colors ${
              targetReached
                ? "border-emerald-500/20 bg-emerald-500/[0.06]"
                : "border-violet-500/15 bg-violet-500/[0.05]"
            }`}
            id="daily-target-card"
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className={`rounded-lg p-1.5 ${targetReached ? "bg-emerald-500/10 text-emerald-400" : "bg-violet-500/10 text-violet-400"}`}>
                  {targetReached ? <CheckCircle2 className="h-4 w-4" /> : <Target className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                    Objectif du jour : +{DAILY_EARNINGS_TARGET} €
                  </span>
                  <p className="mt-0.5 truncate text-[11px] text-zinc-400">
                    {targetReached
                      ? "Objectif atteint"
                      : finalBalance !== ""
                        ? `Encore ${formatCurrency(remainingToTarget)} à réaliser`
                        : cashNum > 0
                          ? `Espèces après -24 % : ${formatCurrency(cashNum)}`
                          : "Solde final à atteindre"}
                  </p>
                </div>
              </div>
              <strong className={`shrink-0 font-mono text-base font-bold ${targetReached ? "text-emerald-400" : "text-violet-300"}`}>
                {formatCurrency(targetFinalBalance)}
              </strong>
            </div>

            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-black/30">
              <div
                className={`h-full rounded-full transition-[width] duration-300 ${targetReached ? "bg-emerald-400" : "bg-violet-400"}`}
                style={{ width: `${targetProgress}%` }}
              />
            </div>
          </div>
        )}

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
            className="min-h-12 w-full rounded-xl border border-white/10 bg-[#0F1115] px-3.5 text-base text-white transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 sm:text-sm"
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
              {cashNum > 0 && (
                <span className="block text-[10px] text-sky-400">Espèces retenues : {formatCurrency(cashNum)} (-24 %)</span>
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
