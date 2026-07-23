import React, { useEffect, useState } from "react";
import { AlertCircle, Banknote, Calendar, CheckCircle2, Clock3, CreditCard, PlusCircle, Save, Target, Trash2, WalletCards, X } from "lucide-react";
import { PaymentMethod, RideEntry, ShiftEntry } from "../types";

const DAILY_EARNINGS_TARGET = 200;
const CASH_COMMISSION_RATE = 0.24;

type RideInput = { amount: string; paymentMethod: PaymentMethod };

interface AddShiftFormProps {
  onSave: (entry: Omit<ShiftEntry, "id" | "createdAt">) => void;
  editingEntry: ShiftEntry | null;
  onCancelEdit: () => void;
}

const emptyRide = (paymentMethod: PaymentMethod = "card"): RideInput => ({ amount: "", paymentMethod });
const roundMoney = (amount: number) => Math.round(amount * 100) / 100;
const parseNum = (value: string) => {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const AddShiftForm: React.FC<AddShiftFormProps> = ({ onSave, editingEntry, onCancelEdit }) => {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [rides, setRides] = useState<RideInput[]>([emptyRide()]);
  const [initialBalance, setInitialBalance] = useState("");
  const [finalBalance, setFinalBalance] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editingEntry) {
      const existingRides = editingEntry.rides?.length
        ? editingEntry.rides
        : [
            ...(editingEntry.finalBalance > editingEntry.initialBalance
              ? [{ amount: editingEntry.finalBalance - editingEntry.initialBalance, paymentMethod: "card" as const }]
              : []),
            ...(editingEntry.cashRides ?? []).map((amount) => ({ amount, paymentMethod: "cash" as const })),
          ];
      setDate(editingEntry.date);
      setStartTime(editingEntry.startTime);
      setEndTime(editingEntry.endTime);
      setRides(existingRides.length
        ? [...existingRides.map((ride) => ({ ...ride, amount: String(ride.amount) })), emptyRide(existingRides[existingRides.length - 1].paymentMethod)]
        : [emptyRide()]);
      setInitialBalance(editingEntry.initialBalance ? String(editingEntry.initialBalance) : "");
      setFinalBalance(editingEntry.finalBalance ? String(editingEntry.finalBalance) : "");
      setNotes(editingEntry.notes ?? "");
    } else {
      const today = new Date();
      const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60_000);
      setDate(localToday.toISOString().slice(0, 10));
      setStartTime("");
      setEndTime("");
      setRides([emptyRide()]);
      setInitialBalance("");
      setFinalBalance("");
      setNotes("");
    }
    setErrorMessage(null);
  }, [editingEntry]);

  const validRides: RideEntry[] = rides
    .map((ride) => ({ amount: parseNum(ride.amount), paymentMethod: ride.paymentMethod }))
    .filter((ride) => ride.amount > 0);
  const cardTotal = roundMoney(validRides.filter((ride) => ride.paymentMethod === "card").reduce((sum, ride) => sum + ride.amount, 0));
  const cashGross = roundMoney(validRides.filter((ride) => ride.paymentMethod === "cash").reduce((sum, ride) => sum + ride.amount, 0));
  const cashCommission = roundMoney(cashGross * CASH_COMMISSION_RATE);
  const cashNet = roundMoney(cashGross - cashCommission);
  const grossEarnings = roundMoney(cardTotal + cashNet);
  const netEarnings = grossEarnings;
  const targetProgress = Math.min(100, Math.max(0, (grossEarnings / DAILY_EARNINGS_TARGET) * 100));
  const targetReached = grossEarnings >= DAILY_EARNINGS_TARGET;

  const formatCurrency = (amount: number) => new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);

  const updateRide = (index: number, updates: Partial<RideInput>) => {
    setRides((current) => {
      const next = current.map((ride, rideIndex) => rideIndex === index ? { ...ride, ...updates } : ride);
      const nextRow = next[index + 1];

      if (updates.paymentMethod && nextRow?.amount.trim() === "") {
        next[index + 1] = { ...nextRow, paymentMethod: updates.paymentMethod };
      }

      const isTypingOnLastRow = index === current.length - 1
        && updates.amount !== undefined
        && updates.amount.trim() !== "";
      return isTypingOnLastRow ? [...next, emptyRide(next[index].paymentMethod)] : next;
    });
  };

  const removeRide = (index: number) => {
    setRides((current) => {
      const next = current.filter((_, rideIndex) => rideIndex !== index);
      if (next.length === 0) next.push(emptyRide());
      else if (next[next.length - 1].amount.trim() !== "") next.push(emptyRide(next[next.length - 1].paymentMethod));
      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    if (!date) return setErrorMessage("Veuillez sélectionner une date.");
    if (!startTime || !endTime) return setErrorMessage("Veuillez renseigner l’heure de début et l’heure de fin.");
    if (validRides.length === 0) return setErrorMessage("Ajoutez au moins une course avec un montant supérieur à 0 €.");
    if (parseNum(initialBalance) < 0 || parseNum(finalBalance) < 0) return setErrorMessage("Les soldes ne peuvent pas être négatifs.");

    onSave({
      date,
      startTime,
      endTime,
      initialBalance: roundMoney(parseNum(initialBalance)),
      finalBalance: roundMoney(parseNum(finalBalance)),
      rides: validRides,
      cashRides: validRides.filter((ride) => ride.paymentMethod === "cash").map((ride) => ride.amount),
      cashEarnings: cashNet,
      grossEarnings,
      expenses: 0,
      netEarnings,
      notes: notes.trim(),
    });

    if (!editingEntry) {
      setRides([emptyRide()]);
      setStartTime("");
      setEndTime("");
      setInitialBalance("");
      setFinalBalance("");
      setNotes("");
    }
  };

  return (
    <div className="glass-card glass-card--blue rounded-[28px] p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PlusCircle className={`h-5 w-5 ${editingEntry ? "text-amber-400" : "text-emerald-400"}`} />
          <h2 className="text-lg font-bold text-white">{editingEntry ? "Modifier la journée" : "Saisir mes courses"}</h2>
        </div>
        {editingEntry && (
          <button type="button" onClick={onCancelEdit} className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-2.5 py-1.5 text-xs text-zinc-400">
            <X className="h-3.5 w-3.5" /> Annuler
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" id="shift-entry-form">
        {errorMessage && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-500/10 bg-rose-500/5 p-3.5 text-xs text-rose-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{errorMessage}</span>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400"><Calendar className="h-3.5 w-3.5 text-emerald-500" />Date</label>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="min-h-12 w-full rounded-xl border border-white/10 bg-[#0F1115] px-3 text-base text-white [color-scheme:dark] focus:border-emerald-500 focus:outline-none sm:text-sm" required />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:col-span-2">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-400"><Clock3 className="h-3.5 w-3.5 text-emerald-400" />Début</label>
              <input aria-label="Heure de début" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="min-h-12 w-full rounded-xl border border-white/10 bg-[#0F1115] px-3 font-mono !text-[15px] text-white [color-scheme:dark] focus:border-emerald-400/50 focus:outline-none sm:text-sm" required />
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-400"><Clock3 className="h-3.5 w-3.5 text-teal-300" />Fin</label>
              <input aria-label="Heure de fin" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="min-h-12 w-full rounded-xl border border-white/10 bg-[#0F1115] px-3 font-mono !text-[15px] text-white [color-scheme:dark] focus:border-teal-300/50 focus:outline-none sm:text-sm" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:col-span-3">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-400"><WalletCards className="h-3.5 w-3.5 text-emerald-400" />Solde départ <span className="text-[7px] text-zinc-600">Info</span></label>
              <div className="relative"><input aria-label="Solde de départ informatif" type="text" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" value={initialBalance} onChange={(event) => setInitialBalance(event.target.value)} placeholder="0,00" className="min-h-12 w-full rounded-xl border border-white/10 bg-[#0F1115] pl-3 pr-7 font-mono !text-[15px] text-white focus:border-emerald-400/50 focus:outline-none sm:text-sm" /><span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500">€</span></div>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gray-400"><WalletCards className="h-3.5 w-3.5 text-teal-300" />Solde fin <span className="text-[7px] text-zinc-600">Info</span></label>
              <div className="relative"><input aria-label="Solde de fin informatif" type="text" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" value={finalBalance} onChange={(event) => setFinalBalance(event.target.value)} placeholder="0,00" className="min-h-12 w-full rounded-xl border border-white/10 bg-[#0F1115] pl-3 pr-7 font-mono !text-[15px] text-white focus:border-teal-300/50 focus:outline-none sm:text-sm" /><span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500">€</span></div>
            </div>
          </div>
        </div>

        <div className="glass-inset rounded-[20px] p-3 sm:p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[13px] font-bold text-white sm:text-sm">Courses de la journée</h3>
              <p className="mt-0.5 text-[9px] leading-relaxed text-zinc-500 sm:text-[10px]">La ligne suivante apparaît automatiquement.</p>
            </div>
            {validRides.length > 0 && (
              <span className="shrink-0 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-emerald-300">
                {validRides.length} course{validRides.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="mt-2.5 space-y-1.5">
            {rides.map((ride, index) => (
              <div
                key={index}
                className={`group grid items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-1.5 transition-colors focus-within:border-emerald-500/40 sm:gap-2 sm:p-2 ${
                  rides.length > 1
                    ? "grid-cols-[minmax(0,1fr)_146px_34px] sm:grid-cols-[minmax(0,1fr)_210px_40px]"
                    : "grid-cols-[minmax(0,1fr)_146px] sm:grid-cols-[minmax(0,1fr)_210px]"
                }`}
              >
                <div className="relative">
                  <span className="pointer-events-none absolute left-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.04] font-mono text-[8px] font-bold text-zinc-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <input aria-label={`Montant de la course ${index + 1}`} type="text" inputMode="decimal" enterKeyHint="next" pattern="[0-9]*[.,]?[0-9]*" value={ride.amount} onChange={(event) => updateRide(index, { amount: event.target.value })} placeholder={ride.amount === "" && index === rides.length - 1 && validRides.length > 0 ? "Suivante..." : "Montant"} className="ride-amount-input min-h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.025] pl-9 pr-7 font-mono !text-[15px] font-semibold text-white outline-none placeholder:font-sans placeholder:text-[11px] placeholder:font-medium placeholder:text-zinc-600 focus:border-emerald-400/40 focus:bg-emerald-400/[0.025] focus:ring-2 focus:ring-emerald-400/[0.06] sm:min-h-11 sm:pl-10 sm:pr-8 sm:!text-sm" />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-zinc-600">€</span>
                </div>
                <div className="grid grid-cols-2 rounded-lg border border-white/[0.08] bg-black/20 p-0.5 sm:p-1">
                  <button type="button" aria-pressed={ride.paymentMethod === "card"} onClick={() => updateRide(index, { paymentMethod: "card" })} className={`flex min-h-8 items-center justify-center gap-1 rounded-md text-[8px] font-bold transition-all sm:min-h-9 sm:gap-1.5 sm:text-[9px] ${ride.paymentMethod === "card" ? "bg-emerald-500 text-white" : "text-zinc-600 hover:text-zinc-900"}`}><CreditCard className="h-3 w-3 sm:h-3.5 sm:w-3.5" />Carte</button>
                  <button type="button" aria-pressed={ride.paymentMethod === "cash"} onClick={() => updateRide(index, { paymentMethod: "cash" })} className={`flex min-h-8 items-center justify-center gap-1 rounded-md text-[8px] font-bold transition-all sm:min-h-9 sm:gap-1.5 sm:text-[9px] ${ride.paymentMethod === "cash" ? "bg-emerald-700 text-white" : "text-zinc-600 hover:text-zinc-900"}`}><Banknote className="h-3 w-3 sm:h-3.5 sm:w-3.5" />Espèces</button>
                </div>
                {rides.length > 1 && <button type="button" onClick={() => removeRide(index)} aria-label={`Supprimer la course ${index + 1}`} className="flex h-9 w-[34px] items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-zinc-600 transition hover:border-rose-400/20 hover:bg-rose-400/[0.06] hover:text-rose-400 sm:h-10 sm:w-10"><Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" /></button>}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Summary label="Carte" value={cardTotal} color="text-emerald-300" />
          <Summary label="Espèces brut" value={cashGross} color="text-teal-300" />
          <Summary label="Bolt 24 %" value={-cashCommission} color="text-rose-400" />
          <Summary label="Total" value={netEarnings} color="text-emerald-400" />
        </div>

        {validRides.length > 0 && (
          <div className={`rounded-xl border px-3.5 py-3 ${targetReached ? "border-emerald-400/25 bg-emerald-400/[0.08]" : "border-teal-400/20 bg-teal-400/[0.06]"}`}>
            <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs text-zinc-400">{targetReached ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Target className="h-4 w-4 text-teal-300" />}Objectif brut : {formatCurrency(DAILY_EARNINGS_TARGET)}</div><strong className="font-mono text-sm text-white">{formatCurrency(grossEarnings)}</strong></div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-black/30"><div className={`h-full rounded-full ${targetReached ? "bg-emerald-400" : "bg-teal-400"}`} style={{ width: `${targetProgress}%` }} /></div>
          </div>
        )}

        <input type="text" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes / observations (optionnel)" className="min-h-12 w-full rounded-xl border border-white/10 bg-[#0F1115] px-3.5 text-base text-white focus:border-emerald-500 focus:outline-none sm:text-sm" />

        <button type="submit" className={`primary-action flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white ${editingEntry ? "is-editing" : ""}`}><Save className="h-4 w-4" />{editingEntry ? "Mettre à jour" : "Enregistrer la journée"}</button>
      </form>
    </div>
  );
};

const Summary = ({ label, value, color, wide = false }: { label: string; value: number; color: string; wide?: boolean }) => (
  <div className={`rounded-xl border border-white/5 bg-[#0F1115] p-3 ${wide ? "col-span-2 sm:col-span-1" : ""}`}>
    <span className="block text-[8px] font-bold uppercase tracking-wide text-zinc-600">{label}</span>
    <strong className={`mt-1 block truncate font-mono text-xs ${color}`}>{new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value)}</strong>
  </div>
);
