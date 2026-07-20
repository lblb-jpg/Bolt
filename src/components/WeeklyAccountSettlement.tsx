import { useMemo, useState } from "react";
import { ChevronDown, Fuel, ReceiptText, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import { getCompletedWeeklySettlements } from "../earnings";
import { ShiftEntry } from "../types";

interface WeeklyAccountSettlementProps {
  entries: ShiftEntry[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);

const formatDate = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
};

export const WeeklyAccountSettlement = ({ entries }: WeeklyAccountSettlementProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const settlements = useMemo(() => getCompletedWeeklySettlements(entries), [entries]);

  if (settlements.length === 0) return null;

  const latest = settlements[0];
  const previous = settlements[1];
  const difference = previous ? latest.totalAfterFee - previous.totalAfterFee : null;
  const differencePercent = previous && previous.totalAfterFee !== 0
    ? (difference! / Math.abs(previous.totalAfterFee)) * 100
    : null;

  return (
    <section aria-labelledby="weekly-account-title" className="pt-1">
      <div className="overflow-hidden rounded-xl border border-white/[0.04] bg-[#14171C]">
        <button
          type="button"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          aria-expanded={isExpanded}
          aria-controls="weekly-account-details"
          className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left"
          id="weekly-account-toggle"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <ReceiptText className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
            <div className="min-w-0">
              <h2 id="weekly-account-title" className="truncate text-[11px] font-semibold text-zinc-400">
                Bilan hebdomadaire
              </h2>
              <p className="truncate text-[9px] text-zinc-600">
                {formatDate(latest.weekStart)} → {formatDate(latest.weekEnd)} · {latest.daysWorked} jour{latest.daysWorked > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <strong className={`font-mono text-xs ${latest.totalAfterFee >= 0 ? "text-zinc-300" : "text-rose-400"}`}>
              {formatCurrency(latest.totalAfterFee)}
            </strong>
            <ChevronDown className={`h-3.5 w-3.5 text-zinc-600 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          </div>
        </button>

        <div
          id="weekly-account-details"
          aria-hidden={!isExpanded}
          className={`grid transition-[grid-template-rows] duration-300 ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        >
          <div className="overflow-hidden">
            <div className="space-y-3 border-t border-white/[0.04] px-3.5 py-3">
              {settlements.map((week) => (
                <div key={week.weekStart} className="rounded-xl border border-white/[0.05] bg-black/10 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-semibold text-zinc-400">
                      {formatDate(week.weekStart)} → {formatDate(week.weekEnd)}
                    </span>
                    <span className="text-[9px] text-zinc-600">
                      {week.daysWorked} jour{week.daysWorked > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-white/[0.025] p-2.5">
                      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wide text-zinc-600">
                        <WalletCards className="h-3 w-3 text-emerald-500" /> Gains bruts
                      </div>
                      <strong className="mt-1 block font-mono text-xs text-zinc-300">{formatCurrency(week.totalGross)}</strong>
                    </div>
                    <div className="rounded-lg bg-white/[0.025] p-2.5">
                      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wide text-zinc-600">
                        <Fuel className="h-3 w-3 text-rose-500" /> Carburant
                      </div>
                      <strong className="mt-1 block font-mono text-xs text-rose-400">-{formatCurrency(week.totalExpenses)}</strong>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-[10px]">
                    <span className="text-zinc-600">Gain après carburant</span>
                    <span className="font-mono text-zinc-400">{formatCurrency(week.totalNetBeforeFee)}</span>
                    <span className="text-zinc-600">Frais de compte</span>
                    <span className="font-mono text-orange-400">-{formatCurrency(week.fee)}</span>
                    <span className="border-t border-white/[0.05] pt-2 font-semibold text-zinc-300">Bénéfice final</span>
                    <strong className={`border-t border-white/[0.05] pt-2 font-mono ${week.totalAfterFee >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {formatCurrency(week.totalAfterFee)}
                    </strong>
                  </div>
                  {week.weekStart === latest.weekStart && difference !== null && (
                    <div className={`mt-3 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[10px] ${difference >= 0 ? "bg-emerald-500/[0.06] text-emerald-400" : "bg-rose-500/[0.06] text-rose-400"}`}>
                      {difference >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      <span>
                        {difference >= 0 ? "+" : ""}{formatCurrency(difference)} vs semaine précédente
                        {differencePercent !== null ? ` (${differencePercent >= 0 ? "+" : ""}${differencePercent.toFixed(0)} %)` : ""}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
