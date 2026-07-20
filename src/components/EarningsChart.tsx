import React, { useState } from "react";
import { BarChart3, LineChart, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { ShiftEntry } from "../types";

interface EarningsChartProps {
  entries: ShiftEntry[];
}

export const EarningsChart: React.FC<EarningsChartProps> = ({ entries }) => {
  const [chartType, setChartType] = useState<"net" | "gross">("net");

  // Format date helper
  const formatDateLabel = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`; // e.g. "20/07"
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Process entries: we sort chronologically (oldest to newest) to display on a time series chart
  const chronEntries = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-10); // Show last 10 days for legibility

  const isEmpty = chronEntries.length === 0;

  // Chart config
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 30;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Find max value for scaling
  const getValues = () => {
    if (chartType === "net") {
      return chronEntries.map(e => e.netEarnings);
    }
    return chronEntries.map(e => e.grossEarnings);
  };

  const values = getValues();
  const maxValue = Math.max(100, ...values) * 1.15; // padding top space
  const minValue = 0; // we clip at 0 for standard display or handle negative if needed

  // Coordinates calculators
  const getX = (index: number) => {
    if (chronEntries.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (chronEntries.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const scale = chartHeight / (maxValue - minValue);
    const clampedVal = Math.max(0, val);
    return paddingTop + chartHeight - clampedVal * scale;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Generate grid lines
  const gridLinesCount = 4;
  const gridLines = Array.from({ length: gridLinesCount }).map((_, i) => {
    const val = minValue + (maxValue - minValue) * (i / (gridLinesCount - 1));
    return {
      value: val,
      y: getY(val),
    };
  });

  return (
    <div className="bg-[#16191F] border border-white/5 rounded-2xl p-5 shadow-xl shadow-black/10 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/5 text-emerald-400 border border-emerald-500/10">
            <LineChart className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Performance Historique Récente</h3>
            <p className="text-xs text-gray-400">Évolution de mes revenus (10 derniers jours)</p>
          </div>
        </div>

        {/* Toggle Chart Type */}
        {!isEmpty && (
          <div className="flex bg-[#0F1115] p-1 rounded-xl border border-white/5 self-stretch sm:self-auto">
            <button
              onClick={() => setChartType("net")}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                chartType === "net"
                  ? "bg-emerald-500 text-[#0F1115]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              id="chart-toggle-net"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Bénéfice Net</span>
            </button>
            <button
              onClick={() => setChartType("gross")}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                chartType === "gross"
                  ? "bg-emerald-500 text-[#0F1115]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              id="chart-toggle-gross"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Gains Bruts</span>
            </button>
          </div>
        )}
      </div>

      {isEmpty ? (
        <div className="h-48 border border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center text-center p-6 gap-2">
          <AlertCircle className="h-8 w-8 text-gray-600 animate-pulse" />
          <span className="text-sm text-gray-400 font-medium">Données insuffisantes</span>
          <span className="text-xs text-gray-500 max-w-sm">
            Enregistrez au moins une journée de travail pour visualiser votre graphique d'évolution des gains.
          </span>
        </div>
      ) : (
        <div className="relative w-full overflow-hidden">
          {/* Responsive SVG wrapper with fixed aspect ratio */}
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            width="100%"
            height="100%"
            className="overflow-visible select-none"
            id="earnings-history-svg-chart"
          >
            {/* Grid Lines */}
            {gridLines.map((line, idx) => (
              <g key={idx} className="opacity-40">
                <line
                  x1={paddingLeft}
                  y1={line.y}
                  x2={svgWidth - paddingRight}
                  y2={line.y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={line.y + 4}
                  fill="#9ca3af"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {formatCurrency(line.value)}
                </text>
              </g>
            ))}

            {/* Gradient definition for bars and path fill */}
            <defs>
              <linearGradient id="chartBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="chartBarGradGross" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="areaGradientGross" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Bars displaying background fill for hover areas */}
            {chronEntries.map((entry, idx) => {
              const x = getX(idx);
              const val = chartType === "net" ? entry.netEarnings : entry.grossEarnings;
              const y = getY(val);
              const barWidth = Math.max(12, Math.min(32, chartWidth / chronEntries.length * 0.4));
              
              return (
                <g key={entry.id} className="group cursor-pointer">
                  {/* Subtle bar background */}
                  <rect
                    x={x - barWidth / 2}
                    y={y}
                    width={barWidth}
                    height={Math.max(0, paddingTop + chartHeight - y)}
                    fill={chartType === "net" ? "url(#chartBarGrad)" : "url(#chartBarGradGross)"}
                    rx="4"
                    className="transition-all duration-300 group-hover:opacity-100 opacity-60"
                  />
                  
                  {/* Top glowing cap on bar */}
                  <rect
                    x={x - barWidth / 2}
                    y={y - 1.5}
                    width={barWidth}
                    height="3"
                    fill={chartType === "net" ? "#10b981" : "#f59e0b"}
                    rx="1.5"
                    className="transition-all duration-300 group-hover:brightness-125"
                  />

                  {/* Text value above bar on hover */}
                  <text
                    x={x}
                    y={y - 8}
                    fill={chartType === "net" ? "#34d399" : "#fbbf24"}
                    fontSize="9.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                  >
                    {formatCurrency(val)}
                  </text>
                </g>
              );
            })}

            {/* Line / Path linking the points */}
            {chronEntries.length > 1 && (
              <>
                {/* Area under line */}
                <path
                  d={`
                    M ${getX(0)} ${paddingTop + chartHeight}
                    ${chronEntries.map((entry, idx) => `L ${getX(idx)} ${getY(chartType === "net" ? entry.netEarnings : entry.grossEarnings)}`).join(" ")}
                    L ${getX(chronEntries.length - 1)} ${paddingTop + chartHeight}
                    Z
                  `}
                  fill={chartType === "net" ? "url(#areaGradient)" : "url(#areaGradientGross)"}
                  className="pointer-events-none"
                />

                {/* Stroke line */}
                <path
                  d={chronEntries.map((entry, idx) => `${idx === 0 ? "M" : "L"} ${getX(idx)} ${getY(chartType === "net" ? entry.netEarnings : entry.grossEarnings)}`).join(" ")}
                  fill="none"
                  stroke={chartType === "net" ? "#10b981" : "#f59e0b"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none"
                />
              </>
            )}

            {/* Data Dots */}
            {chronEntries.map((entry, idx) => {
              const x = getX(idx);
              const val = chartType === "net" ? entry.netEarnings : entry.grossEarnings;
              const y = getY(val);
              return (
                <circle
                  key={`dot-${entry.id}`}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#0F1115"
                  stroke={chartType === "net" ? "#34d399" : "#fbbf24"}
                  strokeWidth="2"
                  className="cursor-pointer hover:r-5 transition-all"
                  title={`${entry.date}: ${formatCurrency(val)}`}
                />
              );
            })}

            {/* X Axis Labels */}
            {chronEntries.map((entry, idx) => {
              const x = getX(idx);
              return (
                <text
                  key={`label-${entry.id}`}
                  x={x}
                  y={svgHeight - 10}
                  fill="#9ca3af"
                  fontSize="8.5"
                  textAnchor="middle"
                  fontWeight="medium"
                >
                  {formatDateLabel(entry.date)}
                </text>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};
