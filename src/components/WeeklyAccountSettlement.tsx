import { useMemo, useState } from "react";
import { ChevronDown, ReceiptText } from "lucide-react";
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
                Compte hebdomadaire clôturé
              </h2>
              <p className="truncate text-[9px] text-zinc-600">
                Semaine du {formatDate(latest.weekStart)} au {formatDate(latest.nextMonday)}
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
            <div className="space-y-2 border-t border-white/[0.04] px-3.5 py-3">
              {settlements.map((week) => (
                <div key={week.weekStart} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-[10px]">
                  <span className="text-zinc-500">
                    {formatDate(week.weekStart)} → {formatDate(week.nextMonday)} · {week.daysWorked} jour{week.daysWorked > 1 ? "s" : ""}
                  </span>
                  <span className="font-mono text-zinc-400">{formatCurrency(week.totalBeforeFee)}</span>
                  <span className="text-zinc-600">Frais de compte</span>
                  <span className="font-mono text-orange-400">-{formatCurrency(week.fee)}</span>
                  <span className="font-semibold text-zinc-400">Solde après clôture</span>
                  <strong className={`font-mono ${week.totalAfterFee >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {formatCurrency(week.totalAfterFee)}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
