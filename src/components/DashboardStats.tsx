import React, { useState } from "react";
import { TrendingUp, CalendarDays, Trophy, WalletCards, ChevronDown, Banknote, CreditCard } from "lucide-react";
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
      title: "Total après Bolt",
      value: formatCurrency(stats.totalGross),
      icon: WalletCards,
      color: "text-amber-400",
    },
    {
      title: "Espèces avant déduction",
      value: formatCurrency(stats.totalCashGross),
      subvalue: `Après -24 % : ${formatCurrency(stats.totalCash)}`,
      icon: Banknote,
      color: "text-teal-300",
    },
    {
      title: "Jours travaillés",
      value: stats.daysCount.toString(),
      icon: CalendarDays,
      color: "text-teal-300",
    },
    {
      title: "Moyenne / jour",
      value: formatCurrency(stats.averageNetPerDay),
      icon: TrendingUp,
      color: "text-teal-300",
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
    <div className="glass-card glass-card--cyan h-full overflow-hidden rounded-[26px] transition-transform">
      <button
        type="button"
        onClick={() => setIsExpanded((expanded) => !expanded)}
        aria-expanded={isExpanded}
        aria-controls="monthly-summary-details"
        className="flex w-full items-center justify-between gap-3 p-3.5 text-left sm:p-4"
        id="monthly-summary-toggle"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="icon-well icon-well--cyan rounded-[14px] p-2.5 text-emerald-200">
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
          <div className="monthly-total text-right">
            <span className="monthly-total__label">Total du mois</span>
            <strong className="monthly-total__value">
              {formatCurrency(stats.totalNet)}
            </strong>
            <span className="monthly-total__card">
              <CreditCard className="h-2.5 w-2.5" /> Carte {formatCurrency(Math.max(0, stats.totalGross - stats.totalCash))}
            </span>
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
          <div className="grid grid-cols-2 gap-2.5 border-t border-white/10 p-3.5 sm:p-4 lg:grid-cols-3">
            {secondaryStats.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="glass-inset min-w-0 rounded-2xl p-3"
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
                  {card.subvalue && (
                    <span className="mt-1 block text-[9px] font-semibold text-teal-500">{card.subvalue}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
