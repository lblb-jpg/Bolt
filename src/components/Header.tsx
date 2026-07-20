import React from "react";
import { Car, RefreshCw } from "lucide-react";
import { supabaseConfigured } from "../supabase";

interface HeaderProps {
  isSyncing: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isSyncing, onRefresh }) => {
  return (
    <header className="border-b border-white/5 bg-[#16191F]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Car className="h-5 w-5 shrink-0 text-emerald-400" id="header-logo-icon" />
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-none">
            MyShift
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 text-[11px] font-medium ${supabaseConfigured ? "text-emerald-400" : "text-amber-400"}`}
            title={supabaseConfigured ? "Données synchronisées dans le cloud" : "Données stockées localement"}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${supabaseConfigured ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span>{supabaseConfigured ? "En ligne" : "Local"}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="flex items-center justify-center p-2 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
            title="Actualiser les données"
            id="refresh-data-btn"
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isSyncing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
