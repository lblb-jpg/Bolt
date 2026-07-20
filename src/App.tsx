import { useState, useEffect, useMemo } from "react";
import { Header } from "./components/Header";
import { AddShiftForm } from "./components/AddShiftForm";
import { HistoryList } from "./components/HistoryList";
import { DashboardStats } from "./components/DashboardStats";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { dbService } from "./dbService";
import { ShiftEntry } from "./types";

export default function App() {
  const [entries, setEntries] = useState<ShiftEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<ShiftEntry | null>(null);
  const [pendingAction, setPendingAction] = useState<
    | { type: "delete"; entry: ShiftEntry }
    | { type: "edit"; entry: ShiftEntry; updates: Omit<ShiftEntry, "id" | "createdAt"> }
    | null
  >(null);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthEntries = entries.filter((entry) => entry.date.startsWith(currentMonth));
    const totalNet = monthEntries.reduce((sum, entry) => sum + entry.netEarnings, 0);
    const totalExpenses = monthEntries.reduce((sum, entry) => sum + entry.expenses, 0);
    const bestEntry = monthEntries.reduce<ShiftEntry | null>(
      (best, entry) => (!best || entry.netEarnings > best.netEarnings ? entry : best),
      null,
    );

    return {
      label: now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
      stats: {
        totalGross: monthEntries.reduce((sum, entry) => sum + entry.grossEarnings, 0),
        totalNet,
        totalExpenses,
        daysCount: monthEntries.length,
        averageNetPerDay: monthEntries.length > 0 ? totalNet / monthEntries.length : 0,
        maxNetDay: bestEntry ? { date: bestEntry.date, amount: bestEntry.netEarnings } : null,
      },
    };
  }, [entries]);

  // Load entries on mount
  const fetchEntries = async () => {
    setIsSyncing(true);
    try {
      const data = await dbService.getEntries();
      setEntries(data);
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Save or edit entry
  const handleSaveEntry = async (entryData: Omit<ShiftEntry, "id" | "createdAt">) => {
    if (editingEntry) {
      setPendingAction({ type: "edit", entry: editingEntry, updates: entryData });
      return;
    }

    setIsSyncing(true);
    try {
      await dbService.addEntry({
        ...entryData,
        createdAt: Date.now(),
      });
      await fetchEntries();
    } catch (err) {
      console.error("Error saving entry:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete entry
  const handleDeleteEntry = async (id: string) => {
    const entry = entries.find((candidate) => candidate.id === id);
    if (entry) setPendingAction({ type: "delete", entry });
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    setIsSyncing(true);
    try {
      if (pendingAction.type === "delete") {
        await dbService.deleteEntry(pendingAction.entry.id);
        if (editingEntry?.id === pendingAction.entry.id) setEditingEntry(null);
      } else {
        await dbService.updateEntry(pendingAction.entry.id, pendingAction.updates);
        setEditingEntry(null);
      }

      await fetchEntries();
    } catch (err) {
      console.error("Error confirming action:", err);
    } finally {
      setIsSyncing(false);
      setPendingAction(null);
    }
  };

  // Edit action
  const handleEditEntry = (entry: ShiftEntry) => {
    setEditingEntry(entry);
    // Smooth scroll to form
    const formElement = document.getElementById("shift-entry-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-zinc-100 selection:bg-emerald-500 selection:text-zinc-950 flex flex-col font-sans">
      {/* Minimal Header */}
      <Header isSyncing={isSyncing} onRefresh={fetchEntries} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8">
        <section aria-labelledby="monthly-summary-title">
          <DashboardStats stats={monthlyStats.stats} monthLabel={monthlyStats.label} />
        </section>

        {/* Simple Add Form */}
        <section id="add-shift-form-section">
          <AddShiftForm
            onSave={handleSaveEntry}
            editingEntry={editingEntry}
            onCancelEdit={handleCancelEdit}
          />
        </section>

        {/* History List Section */}
        <section className="space-y-4" id="historical-data-section">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Historique</h3>
              {entries.length > 0 && <p className="text-xs text-gray-400 mt-0.5">Vos journées enregistrées</p>}
            </div>
          </div>

          <HistoryList
            entries={entries}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
          />
        </section>
      </main>

      {/* Compact Footer */}
      <footer className="border-t border-white/5 bg-[#0F1115] text-zinc-600 text-[11px] py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} MyShift. Compte partagé Bolt sécurisé dans la base de données Cloud.</p>
        </div>
      </footer>

      <ConfirmDialog
        isOpen={pendingAction !== null}
        title={pendingAction?.type === "delete" ? "Supprimer cette journée ?" : "Confirmer la modification"}
        description={
          pendingAction
            ? pendingAction.type === "delete"
              ? `La journée du ${new Date(`${pendingAction.entry.date}T12:00:00`).toLocaleDateString("fr-FR")} sera supprimée de votre historique.`
              : `Les nouvelles informations remplaceront celles de la journée du ${new Date(`${pendingAction.entry.date}T12:00:00`).toLocaleDateString("fr-FR")}.`
            : ""
        }
        confirmLabel={pendingAction?.type === "delete" ? "Supprimer" : "Modifier"}
        variant={pendingAction?.type === "delete" ? "delete" : "edit"}
        isLoading={isSyncing}
        onConfirm={handleConfirmAction}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
