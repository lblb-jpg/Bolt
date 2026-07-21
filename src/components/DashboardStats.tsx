import React, { useState } from "react";
import { TrendingUp, Fuel, CalendarDays, Trophy, WalletCards, ChevronDown, Banknote } from "lucide-react";
import { EarningsStats } from "../types";

interface DashboardStatsProps {
  stats: EarningsStats;
  monthLabel: string;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, monthLabel }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const parseLocalDate = (date: string) => {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const secondaryStats = [
    {
      title: "Gains bruts",
      value: formatCurrency(stats.totalGross),
      icon: WalletCards,
      color: "text-amber-400",
    },
    {
      title: "Espèces après -24 %",
      value: formatCurrency(stats.totalCash),
      icon: Banknote,
      color: "text-sky-400",
    },
    {
      title: "Frais totaux",
      value: formatCurrency(stats.totalExpenses),
      icon: Fuel,
      color: "text-rose-400",
    },
    {
      title: "Jours travaillés",
      value: stats.daysCount.toString(),
      icon: CalendarDays,
      color: "text-violet-400",
    },
    {
      title: "Moyenne / jour",
      value: formatCurrency(stats.averageNetPerDay),
      icon: TrendingUp,
      color: "text-sky-400",
    },
    {
      title: "Meilleure journée",
      value: stats.maxNetDay ? formatCurrency(stats.maxNetDay.amount) : "0,00 €",
      detail: stats.maxNetDay
        ? parseLocalDate(stats.maxNetDay.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
        : undefined,
      icon: Trophy,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#16191F] transition-colors hover:border-white/10">
      <button
        type="button"
        onClick={() => setIsExpanded((expanded) => !expanded)}
        aria-expanded={isExpanded}
        aria-controls="monthly-summary-details"
        className="flex w-full items-center justify-between gap-3 p-3.5 text-left sm:p-4"
        id="monthly-summary-toggle"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-2 text-emerald-400">
            <WalletCards className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 id="monthly-summary-title" className="truncate text-sm font-bold text-white sm:text-base">
              Résumé du mois
            </h2>
            <p className="mt-0.5 truncate text-[11px] capitalize text-zinc-500">{monthLabel}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <div className="text-right">
            <span className="block text-[8px] font-bold uppercase tracking-wider text-zinc-600">Gains nets</span>
            <strong className="block font-mono text-sm font-bold text-emerald-400 sm:text-base">
              {formatCurrency(stats.totalNet)}
            </strong>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-zinc-500 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      <div
        id="monthly-summary-details"
        aria-hidden={!isExpanded}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-2 gap-2.5 border-t border-white/5 p-3.5 sm:p-4 lg:grid-cols-3">
            {secondaryStats.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="min-w-0 rounded-xl border border-white/5 bg-[#0F1115]/70 p-3"
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${card.color}`} />
                    <span className="truncate text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                      {card.title}
                    </span>
                  </div>
                  <div className="mt-2 flex min-w-0 items-baseline gap-1.5">
                    <strong className="truncate font-mono text-sm font-bold text-white sm:text-base">{card.value}</strong>
                    {card.detail && <span className="shrink-0 text-[9px] text-zinc-600">{card.detail}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
