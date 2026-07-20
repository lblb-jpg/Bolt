import React, { useState } from "react";
import { Edit2, Trash2, Calendar, PiggyBank, Search, MessageSquare, AlertCircle } from "lucide-react";
import { ShiftEntry } from "../types";

interface HistoryListProps {
  entries: ShiftEntry[];
  onEdit: (entry: ShiftEntry) => void;
  onDelete: (id: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  entries,
  onEdit,
  onDelete,
}) => {
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("" );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDateLong = (dateStr: string) => {
    try {
      const parts = dateStr.split("-").map(Number);
      const localDate = new Date(parts[0], parts[1] - 1, parts[2]);
      
      return localDate.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Get list of unique months in data for filtering dropdown
  const getMonthsInEntries = () => {
    const months = new Set<string>();
    entries.forEach((e) => {
      try {
        const parts = e.date.split("-");
        if (parts.length >= 2) {
          months.add(`${parts[0]}-${parts[1]}`); // YYYY-MM
        }
      } catch {}
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  };

  const formatMonthLabel = (yearMonth: string) => {
    try {
      const [year, month] = yearMonth.split("-").map(Number);
      const date = new Date(year, month - 1, 1);
      const label = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      return label.charAt(0).toUpperCase() + label.slice(1);
    } catch {
      return yearMonth;
    }
  };

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    // Month filter
    if (filterMonth !== "all") {
      if (!entry.date.startsWith(filterMonth)) {
        return false;
      }
    }
    // Search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const notesMatch = entry.notes?.toLowerCase().includes(query);
      const dateMatch = entry.date.includes(query);
      const longDateMatch = formatDateLong(entry.date).toLowerCase().includes(query);
      return notesMatch || dateMatch || longDateMatch;
    }
    return true;
  });

  const uniqueMonths = getMonthsInEntries();

  // Selected period totals
  const periodTotalNet = filteredEntries.reduce((sum, e) => sum + e.netEarnings, 0);

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      {entries.length > 0 && <div className="bg-[#16191F] border border-white/5 rounded-xl p-2.5 sm:p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex-1 flex flex-row items-center gap-2">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Chercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F1115] border border-white/10 rounded-xl pl-8 sm:pl-10 pr-3 py-2 sm:py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-gray-500"
              id="search-history-input"
            />
          </div>

          {/* Month selector */}
          {uniqueMonths.length > 0 && (
            <div className="w-[110px] sm:w-56 shrink-0">
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full bg-[#0F1115] border border-white/10 rounded-xl px-2 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                id="select-filter-month"
              >
                <option value="all">Tous</option>
                {uniqueMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Live filtered summary */}
        {filteredEntries.length > 0 && (
          <div className="flex items-center justify-between md:justify-start gap-3 bg-[#0F1115] border border-white/5 px-3.5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs text-gray-400">
            <span>
              Total : <strong className="text-white">{filteredEntries.length} jour(s)</strong>
            </span>
            <div className="h-3 w-[1px] bg-white/5" />
            <span>
              Net : <strong className="text-emerald-400 font-mono font-bold">{formatCurrency(periodTotalNet)}</strong>
            </span>
          </div>
        )}
      </div>}

      {/* History table / cards */}
      {filteredEntries.length === 0 ? (
        <div className="bg-[#16191F] border border-white/5 rounded-2xl px-5 py-8 sm:py-10 text-center flex flex-col items-center justify-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-white/[0.03] flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-zinc-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Aucun enregistrement</h4>
            <p className="text-xs leading-relaxed text-gray-500 mt-1 max-w-[280px] mx-auto">
              {entries.length === 0 
                ? "Votre première journée apparaîtra ici après l’enregistrement."
                : "Aucun résultat ne correspond à votre recherche."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden bg-[#16191F] border border-white/5 rounded-2xl">
            <table className="w-full text-left border-collapse" id="history-table">
              <thead>
                <tr className="border-b border-white/5 bg-[#0F1115]/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Solde Début</th>
                  <th className="px-5 py-4">Solde Fin</th>
                  <th className="px-5 py-4 text-amber-400">Gain Brut</th>
                  <th className="px-5 py-4 text-rose-400">Frais</th>
                  <th className="px-5 py-4 text-emerald-400">Bénéfice Net</th>
                  <th className="px-5 py-4">Notes</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/5 transition-colors group">
                    {/* Date */}
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                        {formatDateLong(entry.date)}
                      </span>
                    </td>

                    {/* Solde Début */}
                    <td className="px-5 py-4 font-mono text-sm text-gray-400">
                      {formatCurrency(entry.initialBalance)}
                    </td>

                    {/* Solde Fin */}
                    <td className="px-5 py-4 font-mono text-sm text-zinc-300">
                      {formatCurrency(entry.finalBalance)}
                    </td>

                    {/* Gain Brut */}
                    <td className="px-5 py-4">
                      <div className="font-mono text-sm font-bold text-amber-400">
                        +{formatCurrency(entry.grossEarnings)}
                      </div>
                    </td>

                    {/* Frais */}
                    <td className="px-5 py-4 font-mono text-sm text-rose-400">
                      {entry.expenses > 0 ? `-${formatCurrency(entry.expenses)}` : "—"}
                    </td>

                    {/* Bénéfice Net */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 font-mono">
                        <PiggyBank className="h-3.5 w-3.5" />
                        {formatCurrency(entry.netEarnings)}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="px-5 py-4 max-w-xs">
                      {entry.notes ? (
                        <p className="text-xs text-gray-400 truncate group-hover:text-zinc-300" title={entry.notes}>
                          {entry.notes}
                        </p>
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEdit(entry)}
                          className="p-1.5 rounded-lg border border-white/5 bg-[#0F1115] hover:bg-amber-500/5 text-zinc-400 hover:text-amber-400 hover:border-amber-500/10 transition-all"
                          title="Modifier"
                          id={`edit-btn-${entry.id}`}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(entry.id)}
                          className="p-1.5 rounded-lg border border-white/5 bg-[#0F1115] hover:bg-rose-500/5 text-zinc-400 hover:text-rose-400 hover:border-rose-500/10 transition-all"
                          title="Supprimer"
                          id={`delete-btn-${entry.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-[#16191F] border border-white/5 rounded-2xl p-4 space-y-3.5 hover:border-white/10 transition-all shadow-md"
              >
                {/* Card Header: Date & Net Profit */}
                <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2.5">
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    {formatDateLong(entry.date)}
                  </span>
                  
                  <span className="text-sm font-bold font-mono text-emerald-400 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10 flex items-center gap-1">
                    {formatCurrency(entry.netEarnings)}
                  </span>
                </div>

                {/* Card Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#0F1115]/80 border border-white/5">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Solde Début</span>
                    <span className="text-xs font-mono text-gray-300 font-semibold">{formatCurrency(entry.initialBalance)}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Solde Fin</span>
                    <span className="text-xs font-mono text-gray-300 font-semibold">{formatCurrency(entry.finalBalance)}</span>
                  </div>
                  <div className="space-y-0.5 border-t border-white/5 pt-2">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Gain Brut</span>
                    <span className="text-xs font-mono text-amber-400 font-bold">+{formatCurrency(entry.grossEarnings)}</span>
                  </div>
                  <div className="space-y-0.5 border-t border-white/5 pt-2">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Frais / Carbu</span>
                    <span className="text-xs font-mono text-rose-400 font-semibold">
                      {entry.expenses > 0 ? `-${formatCurrency(entry.expenses)}` : "0,00 €"}
                    </span>
                  </div>
                </div>

                {/* Card Footer: Notes & Actions */}
                <div className="flex items-center justify-between gap-3 pt-0.5">
                  <div className="flex-1 min-w-0">
                    {entry.notes ? (
                      <p className="text-xs text-gray-400 italic flex items-start gap-1.5 bg-[#0F1115]/50 p-2 rounded-lg border border-white/5 truncate" title={entry.notes}>
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-zinc-500 mt-0.5" />
                        <span className="truncate">{entry.notes}</span>
                      </p>
                    ) : (
                      <div className="text-zinc-600 text-xs italic">Aucune note</div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onEdit(entry)}
                      className="p-2 rounded-xl border border-white/5 bg-[#0F1115] text-zinc-400 hover:text-amber-400 active:bg-amber-500/10 transition-colors"
                      title="Modifier"
                      id={`edit-btn-mob-${entry.id}`}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(entry.id)}
                      className="p-2 rounded-xl border border-white/5 bg-[#0F1115] text-zinc-400 hover:text-rose-400 active:bg-rose-500/10 transition-colors"
                      title="Supprimer"
                      id={`delete-btn-mob-${entry.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
