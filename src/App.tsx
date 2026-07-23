import { useState, useEffect, useMemo } from "react";
import { Header } from "./components/Header";
import { AddShiftForm } from "./components/AddShiftForm";
import { HistoryList } from "./components/HistoryList";
import { DashboardStats } from "./components/DashboardStats";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { dbService } from "./dbService";
import { ShiftEntry } from "./types";
import { WeeklyAccountSettlement } from "./components/WeeklyAccountSettlement";
import { NotificationSettings } from "./components/NotificationSettings";
import { NotificationScheduler } from "./components/NotificationScheduler";
import { LoginScreen } from "./components/LoginScreen";
import { profileSession, UserProfile } from "./profileSession";
import { PREFILLED_JULY_ENTRIES } from "./prefilledEntries";

const PREFILL_STORAGE_KEY = "myshift_prefilled_july_2026_v1";
let prefillPromise: Promise<boolean> | null = null;

const ensurePrefilledEntries = (
  profileId: UserProfile["id"],
  currentEntries: ShiftEntry[],
): Promise<boolean> => {
  if (profileId !== "principal" || localStorage.getItem(PREFILL_STORAGE_KEY) === "done") {
    return Promise.resolve(false);
  }
  if (prefillPromise) return prefillPromise;

  prefillPromise = (async () => {
    let addedEntry = false;
    const existingDates = new Set(currentEntries.map((entry) => entry.date));

    for (const entry of PREFILLED_JULY_ENTRIES) {
      if (existingDates.has(entry.date)) continue;
      await dbService.addEntry(profileId, entry);
      existingDates.add(entry.date);
      addedEntry = true;
    }

    localStorage.setItem(PREFILL_STORAGE_KEY, "done");
    return addedEntry;
  })().finally(() => {
    prefillPromise = null;
  });

  return prefillPromise;
};

export default function App() {
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(() => profileSession.getActiveProfile());
  const [entries, setEntries] = useState<ShiftEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<ShiftEntry | null>(null);
  const [currentView, setCurrentView] = useState<"dashboard" | "notifications">(() =>
    window.location.hash === "#notifications" ? "notifications" : "dashboard",
  );
  const [pendingAction, setPendingAction] = useState<
    | { type: "delete"; entry: ShiftEntry }
    | { type: "edit"; entry: ShiftEntry; updates: Omit<ShiftEntry, "id" | "createdAt"> }
    | null
  >(null);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthEntries = entries.filter((entry) => entry.date.startsWith(currentMonth));
    const totalNet = monthEntries.reduce((sum, entry) => sum + entry.grossEarnings, 0);
    const totalExpenses = 0;
    const bestEntry = monthEntries.reduce<ShiftEntry | null>(
      (best, entry) => (!best || entry.grossEarnings > best.grossEarnings ? entry : best),
      null,
    );

    return {
      label: now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
      stats: {
        totalGross: monthEntries.reduce((sum, entry) => sum + entry.grossEarnings, 0),
        totalCash: monthEntries.reduce((sum, entry) => sum + entry.cashEarnings, 0),
        totalCashGross: monthEntries.reduce((sum, entry) => {
          const cashGross = entry.cashRides?.length
            ? entry.cashRides.reduce((rideSum, amount) => rideSum + amount, 0)
            : entry.cashEarnings / 0.76;
          return sum + cashGross;
        }, 0),
        totalNet,
        totalExpenses,
        daysCount: monthEntries.length,
        averageNetPerDay: monthEntries.length > 0 ? totalNet / monthEntries.length : 0,
        maxNetDay: bestEntry ? { date: bestEntry.date, amount: bestEntry.grossEarnings } : null,
      },
    };
  }, [entries]);

  // Load entries on mount
  const fetchEntries = async () => {
    if (!activeProfile) return;
    setIsSyncing(true);
    try {
      let data = await dbService.getEntries(activeProfile.id);
      const entriesAdded = await ensurePrefilledEntries(activeProfile.id, data);
      if (entriesAdded) data = await dbService.getEntries(activeProfile.id);
      setEntries(data);
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (activeProfile) fetchEntries();
    else setEntries([]);
  }, [activeProfile]);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentView(window.location.hash === "#notifications" ? "notifications" : "dashboard");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Save or edit entry
  const handleSaveEntry = async (entryData: Omit<ShiftEntry, "id" | "createdAt">) => {
    if (!activeProfile) return;
    if (editingEntry) {
      setPendingAction({ type: "edit", entry: editingEntry, updates: entryData });
      return;
    }

    setIsSyncing(true);
    try {
      await dbService.addEntry(activeProfile.id, {
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
    if (!pendingAction || !activeProfile) return;

    setIsSyncing(true);
    try {
      if (pendingAction.type === "delete") {
        await dbService.deleteEntry(activeProfile.id, pendingAction.entry.id);
        if (editingEntry?.id === pendingAction.entry.id) setEditingEntry(null);
      } else {
        await dbService.updateEntry(activeProfile.id, pendingAction.entry.id, pendingAction.updates);
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

  const handleLogout = () => {
    profileSession.logout();
    setEditingEntry(null);
    setPendingAction(null);
    setEntries([]);
    setActiveProfile(null);
  };

  if (!activeProfile) {
    return <LoginScreen onLogin={setActiveProfile} />;
  }

  return (
    <div className="app-shell flex min-h-full flex-col font-sans text-zinc-100 selection:bg-emerald-300 selection:text-emerald-950">
      {/* Minimal Header */}
      <Header
        onOpenNotifications={() => { window.location.hash = "notifications"; }}
        notificationsOpen={currentView === "notifications"}
        profileName={activeProfile.name}
        onLogout={handleLogout}
      />
      <div className="app-header-spacer shrink-0" aria-hidden="true" />

      <NotificationScheduler entries={entries} />

      {currentView === "notifications" ? (
        <NotificationSettings onBack={() => {
          window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
          setCurrentView("dashboard");
        }} />
      ) : (
      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 space-y-5 px-3.5 py-5 sm:space-y-7 sm:px-6 sm:py-9">
        <div className="dashboard-intro">
          <div>
            <p className="eyebrow">Vue d’ensemble</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
              Bonjour, {activeProfile.name}
            </h2>
          </div>
          <p className="max-w-xs text-xs leading-relaxed text-slate-400 sm:text-right">
            Vos revenus, vos courses et votre progression réunis dans un espace clair.
          </p>
        </div>

        <section aria-labelledby="monthly-summary-title" className="bento-tile bento-tile--primary">
          <DashboardStats stats={monthlyStats.stats} monthLabel={monthlyStats.label} />
        </section>

        {/* Simple Add Form */}
        <section id="add-shift-form-section" className="bento-feature">
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

        <WeeklyAccountSettlement entries={entries} />
      </main>
      )}

      {/* Compact Footer */}
      <footer className="app-footer relative z-10 mt-12 border-t border-zinc-200 bg-white py-6 text-[11px] text-zinc-500">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} MyShift · Espace {activeProfile.name}</p>
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
