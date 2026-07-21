import React from "react";
import { Car, LogOut, RefreshCw, UserRound } from "lucide-react";
import { supabaseConfigured } from "../supabase";

interface HeaderProps {
  isSyncing: boolean;
  onRefresh: () => void;
  onOpenNotifications: () => void;
  notificationsOpen: boolean;
  profileName: string;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isSyncing, onRefresh, onOpenNotifications, notificationsOpen, profileName, onLogout }) => {
  return (
    <header className="sticky top-0 z-50 isolate border-b border-white/[0.06] bg-[#0F1115] pt-[env(safe-area-inset-top)] shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-3.5 sm:h-[68px] sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/15 bg-emerald-500/[0.07] shadow-[0_0_18px_rgba(16,185,129,0.08)]">
            <Car className="h-[18px] w-[18px] text-emerald-400" id="header-logo-icon" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold leading-none tracking-tight text-white sm:text-xl">
              MyShift
            </h1>
            <p className="mt-1 truncate text-[8px] font-medium uppercase tracking-[0.14em] text-zinc-600 sm:text-[9px]">
              Espace {profileName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden h-9 items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.025] px-3 text-[10px] font-semibold text-zinc-300 sm:flex">
            <UserRound className="h-3.5 w-3.5 text-emerald-400" />
            <span className="max-w-24 truncate">{profileName}</span>
          </div>
          <div
            className={`flex h-9 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-semibold sm:px-3 sm:text-[11px] ${
              supabaseConfigured
                ? "border-emerald-500/10 bg-emerald-500/[0.06] text-emerald-400"
                : "border-amber-500/10 bg-amber-500/[0.06] text-amber-400"
            }`}
            title={supabaseConfigured ? "Données synchronisées dans le cloud" : "Données stockées localement"}
          >
            <span className={`h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor] ${supabaseConfigured ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span>{supabaseConfigured ? "En ligne" : "Local"}</span>
          </div>

          <button
            onClick={onOpenNotifications}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border text-base transition-all active:scale-95 ${notificationsOpen ? "border-sky-500/20 bg-sky-500/10" : "border-white/[0.06] bg-white/[0.025] hover:border-white/10 hover:bg-white/5"}`}
            title="Notifications"
            aria-label="Ouvrir les notifications"
            aria-current={notificationsOpen ? "page" : undefined}
          >
            <span aria-hidden="true">🔔</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025] text-zinc-500 transition-all hover:border-white/10 hover:bg-white/5 hover:text-white active:scale-95 disabled:opacity-50"
            title="Actualiser les données"
            id="refresh-data-btn"
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isSyncing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={onLogout}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025] text-zinc-500 transition-all hover:border-rose-500/15 hover:bg-rose-500/5 hover:text-rose-400 active:scale-95"
            title={`Déconnexion de ${profileName}`}
            aria-label="Se déconnecter"
            id="logout-btn"
          >
            <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />
    </header>
  );
};
