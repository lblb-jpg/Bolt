import React from "react";
import { Car, LogOut, UserRound } from "lucide-react";
import { supabaseConfigured } from "../supabase";

interface HeaderProps {
  onOpenNotifications: () => void;
  notificationsOpen: boolean;
  profileName: string;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications, notificationsOpen, profileName, onLogout }) => {
  return (
    <header className="glass-header fixed inset-x-0 top-0 z-50 isolate w-full overflow-x-clip pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 w-full min-w-0 max-w-5xl items-center justify-between gap-1.5 px-2.5 min-[380px]:gap-2 min-[380px]:px-3.5 sm:h-[72px] sm:gap-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 min-[380px]:gap-2.5 sm:gap-3">
          <div className="brand-mark flex h-9 w-9 shrink-0 items-center justify-center rounded-xl min-[380px]:h-10 min-[380px]:w-10 min-[380px]:rounded-[14px]">
            <Car className="h-4 w-4 text-white min-[380px]:h-[18px] min-[380px]:w-[18px]" id="header-logo-icon" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold leading-none tracking-tight text-white min-[380px]:text-lg sm:text-xl">
              MyShift
            </h1>
            <p className="mt-1 hidden truncate text-[8px] font-medium uppercase tracking-[0.13em] text-slate-500 min-[440px]:block sm:text-[9px] sm:tracking-[0.16em]">
              Espace {profileName}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="glass-control hidden h-9 items-center gap-2 rounded-full px-3 text-[10px] font-semibold text-slate-300 sm:flex">
            <UserRound className="h-3.5 w-3.5 text-emerald-300" />
            <span className="max-w-24 truncate">{profileName}</span>
          </div>
          <div
            className={`flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-full border px-0 text-[10px] font-semibold min-[420px]:px-2.5 sm:px-3 sm:text-[11px] ${
              supabaseConfigured
                ? "border-emerald-300/15 bg-emerald-300/[0.08] text-emerald-300"
                : "border-amber-300/15 bg-amber-300/[0.08] text-amber-300"
            }`}
            title={supabaseConfigured ? "Données synchronisées dans le cloud" : "Données stockées localement"}
          >
            <span className={`h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor] ${supabaseConfigured ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span className="hidden sm:inline">{supabaseConfigured ? "En ligne" : "Local"}</span>
          </div>

          <button
            onClick={onOpenNotifications}
            className={`glass-icon-button flex h-9 w-9 items-center justify-center rounded-xl text-sm transition-all active:scale-95 min-[380px]:h-10 min-[380px]:w-10 min-[380px]:rounded-[14px] min-[380px]:text-base ${notificationsOpen ? "is-active" : ""}`}
            title="Notifications"
            aria-label="Ouvrir les notifications"
            aria-current={notificationsOpen ? "page" : undefined}
          >
            <span aria-hidden="true">🔔</span>
          </button>

          <button
            onClick={onLogout}
            className="glass-icon-button flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all hover:text-rose-300 active:scale-95 min-[380px]:h-10 min-[380px]:w-10 min-[380px]:rounded-[14px]"
            title={`Déconnexion de ${profileName}`}
            aria-label="Se déconnecter"
            id="logout-btn"
          >
            <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
