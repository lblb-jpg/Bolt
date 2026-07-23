import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarCheck,
  ChevronDown,
  Gauge,
  Lightbulb,
  Scale,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { ShiftEntry } from "../types";

interface OverallPerformanceProps {
  entries: ShiftEntry[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);

const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
};

const parseLocalDate = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const OverallPerformance = ({ entries }: OverallPerformanceProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const analysis = useMemo(() => {
    if (entries.length === 0) return null;

    const chronological = [...entries].sort(
      (a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt,
    );
    const netValues = chronological.map((entry) => entry.netEarnings);
    const averageNet = average(netValues);
    const medianNet = median(netValues);
    const totalGross = chronological.reduce((sum, entry) => sum + entry.grossEarnings, 0);
    const operationalExpenses = chronological.reduce((sum, entry) => sum + entry.expenses, 0);
    const expenseRate = totalGross > 0 ? (operationalExpenses / totalGross) * 100 : 0;
    const variance = average(netValues.map((value) => (value - averageNet) ** 2));
    const standardDeviation = Math.sqrt(variance);
    const consistency = averageNet !== 0
      ? Math.max(0, Math.round(100 - Math.min(100, (standardDeviation / Math.abs(averageNet)) * 100)))
      : 0;

    const weekdayGroups = new Map<string, number[]>();
    chronological.forEach((entry) => {
      const weekday = parseLocalDate(entry.date).toLocaleDateString("fr-FR", { weekday: "long" });
      weekdayGroups.set(weekday, [...(weekdayGroups.get(weekday) ?? []), entry.netEarnings]);
    });
    const bestWeekday = [...weekdayGroups.entries()]
      .map(([day, values]) => ({ day, value: average(values), count: values.length }))
      .sort((a, b) => b.value - a.value)[0];

    const recentSize = Math.min(3, Math.floor(chronological.length / 2));
    const recentEntries = recentSize ? chronological.slice(-recentSize) : [];
    const comparisonEntries = recentSize ? chronological.slice(-(recentSize * 2), -recentSize) : [];
    const recentAverage = average(recentEntries.map((entry) => entry.netEarnings));
    const previousAverage = average(comparisonEntries.map((entry) => entry.netEarnings));
    const trendPercent = comparisonEntries.length && previousAverage !== 0
      ? ((recentAverage - previousAverage) / Math.abs(previousAverage)) * 100
      : null;

    let verdict = "Données insuffisantes";
    let verdictColor = "text-teal-300";
    let verdictDot = "bg-teal-300";
    let verdictBackground = "border-teal-400/15 bg-teal-400/5";

    if (entries.length >= 4) {
      if (trendPercent !== null && trendPercent >= 10) {
        verdict = "En progression";
        verdictColor = "text-emerald-400";
        verdictDot = "bg-emerald-400";
        verdictBackground = "border-emerald-500/15 bg-emerald-500/5";
      } else if ((trendPercent === null || trendPercent >= -10) && consistency >= 55) {
        verdict = "Performance stable";
        verdictColor = "text-lime-400";
        verdictDot = "bg-lime-400";
        verdictBackground = "border-lime-500/15 bg-lime-500/5";
      } else {
        verdict = "À optimiser";
        verdictColor = "text-amber-400";
        verdictDot = "bg-amber-400";
        verdictBackground = "border-amber-500/15 bg-amber-500/5";
      }
    }

    const advice: string[] = [];
    if (entries.length < 4) {
      advice.push("Enregistrez au moins 4 journées pour obtenir une tendance réellement fiable.");
    }
    if (expenseRate > 20) {
      advice.push(`Vos frais représentent ${Math.round(expenseRate)} % du brut : réduire les trajets à vide améliorerait directement votre net.`);
    } else if (entries.length >= 2) {
      advice.push(`Vos frais restent contenus à ${Math.round(expenseRate)} % du brut : gardez ce niveau sous les 20 %.`);
    }
    if (trendPercent !== null && trendPercent < -10) {
      advice.push(`La moyenne récente baisse de ${Math.abs(Math.round(trendPercent))} % : comparez les horaires et les zones de vos meilleures journées.`);
    } else if (trendPercent !== null && trendPercent >= 10) {
      advice.push(`Votre moyenne récente progresse de ${Math.round(trendPercent)} % : reproduisez les conditions de ces dernières journées.`);
    }
    if (entries.length >= 3 && consistency < 55) {
      advice.push("Vos résultats sont irréguliers : utilisez des horaires de départ et des zones plus constants pour identifier ce qui fonctionne.");
    }
    if (bestWeekday && bestWeekday.count >= 2) {
      advice.push(`Le ${bestWeekday.day} est votre jour le plus rentable en moyenne : privilégiez-le lorsque vous planifiez vos shifts.`);
    }
    if (advice.length === 0) {
      advice.push("Continuez à enregistrer chaque journée afin d’affiner les recommandations.");
    }

    return {
      averageNet,
      medianNet,
      consistency,
      expenseRate,
      bestWeekday,
      trendPercent,
      verdict,
      verdictColor,
      verdictDot,
      verdictBackground,
      advice: advice.slice(0, 3),
    };
  }, [entries]);

  const cards = analysis
    ? [
        {
          title: "Moyenne nette",
          value: formatCurrency(analysis.averageNet),
          detail: `Sur ${entries.length} journée${entries.length > 1 ? "s" : ""}`,
          icon: BarChart3,
          color: "text-emerald-400",
        },
        {
          title: "Médiane",
          value: formatCurrency(analysis.medianNet),
          detail: "Hors effet des extrêmes",
          icon: Scale,
          color: "text-teal-300",
        },
        {
          title: "Régularité",
          value: `${analysis.consistency} %`,
          detail: analysis.consistency >= 65 ? "Résultats réguliers" : "Résultats variables",
          icon: Gauge,
          color: analysis.consistency >= 65 ? "text-teal-300" : "text-amber-400",
        },
        {
          title: "Meilleur jour",
          value: analysis.bestWeekday?.day ?? "—",
          detail: analysis.bestWeekday ? `${formatCurrency(analysis.bestWeekday.value)} en moyenne` : "Aucune donnée",
          icon: CalendarCheck,
          color: "text-amber-400",
        },
      ]
    : [];

  return (
    <div className="glass-card glass-card--violet h-full overflow-hidden rounded-[26px] transition-transform">
      <button
        type="button"
        onClick={() => setIsExpanded((expanded) => !expanded)}
        aria-expanded={isExpanded}
        aria-controls="overall-performance-details"
        className="flex w-full items-center justify-between gap-3 p-3.5 text-left sm:p-4"
        id="overall-performance-toggle"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="icon-well icon-well--violet rounded-[14px] p-2.5 text-emerald-200">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 id="overall-performance-title" className="truncate text-sm font-bold text-white sm:text-base">
              Analyse globale
            </h2>
            <p className="mt-0.5 truncate text-[11px] text-zinc-500">
              {entries.length
                ? `${entries.length} journée${entries.length > 1 ? "s" : ""} analysée${entries.length > 1 ? "s" : ""}`
                : "En attente de données"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <div className="text-right">
            <span className="block text-[8px] font-bold uppercase tracking-wider text-zinc-600">Bilan</span>
            <strong className={`block text-xs font-bold sm:text-sm ${analysis?.verdictColor ?? "text-zinc-500"}`}>
              {analysis?.verdict ?? "Aucune donnée"}
            </strong>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-zinc-500 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      <div
        id="overall-performance-details"
        aria-hidden={!isExpanded}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          {analysis ? (
            <div className="space-y-3 border-t border-white/10 p-3.5 sm:p-4">
              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                {cards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="glass-inset min-w-0 rounded-2xl p-3">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`h-3.5 w-3.5 shrink-0 ${card.color}`} />
                        <span className="truncate text-[9px] font-bold uppercase tracking-wide text-zinc-500">
                          {card.title}
                        </span>
                      </div>
                      <strong className="mt-2 block truncate font-mono text-sm font-bold capitalize text-white sm:text-base">
                        {card.value}
                      </strong>
                      <span className="mt-0.5 block truncate text-[9px] text-zinc-600">{card.detail}</span>
                    </div>
                  );
                })}
              </div>

              <div className={`rounded-xl border px-3.5 py-3.5 ${analysis.verdictBackground}`}>
                <div className="mb-2.5 flex items-center gap-2">
                  <Lightbulb className={`h-4 w-4 ${analysis.verdictColor}`} />
                  <h3 className="text-xs font-bold text-white">Conseils personnalisés</h3>
                  {analysis.trendPercent !== null && (
                    <span className={`ml-auto flex items-center gap-1 text-[10px] font-bold ${analysis.trendPercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      <TrendingUp className={`h-3.5 w-3.5 ${analysis.trendPercent < 0 ? "rotate-180" : ""}`} />
                      {analysis.trendPercent >= 0 ? "+" : ""}{Math.round(analysis.trendPercent)} % récent
                    </span>
                  )}
                </div>
                <ul className="space-y-2">
                  {analysis.advice.map((item) => (
                    <li key={item} className="flex gap-2 text-[11px] leading-relaxed text-zinc-300">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${analysis.verdictDot}`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="border-t border-white/5 px-4 py-6 text-center text-xs text-zinc-500">
              Enregistrez vos journées pour obtenir une moyenne et des conseils personnalisés.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
