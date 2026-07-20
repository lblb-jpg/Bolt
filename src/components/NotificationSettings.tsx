import { useState } from "react";
import { ArrowLeft, Bell, BellOff, Check, Clock3 } from "lucide-react";
import {
  getNotificationSettings,
  saveNotificationSettings,
  showAppNotification,
} from "../notifications";

interface NotificationSettingsProps { onBack: () => void; }

type PermissionState = NotificationPermission | "unsupported";

export const NotificationSettings = ({ onBack }: NotificationSettingsProps) => {
  const [settings, setSettings] = useState(getNotificationSettings);
  const [permission, setPermission] = useState<PermissionState>(() =>
    "Notification" in window ? Notification.permission : "unsupported",
  );
  const [feedback, setFeedback] = useState("");

  const updateSettings = (next: typeof settings) => {
    setSettings(next);
    saveNotificationSettings(next);
  };

  const handleToggle = async () => {
    setFeedback("");

    if (settings.enabled) {
      updateSettings({ ...settings, enabled: false });
      setFeedback("Rappels désactivés");
      return;
    }

    if (!("Notification" in window)) {
      setPermission("unsupported");
      setFeedback("Les notifications ne sont pas compatibles avec cet appareil.");
      return;
    }

    const result = Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      updateSettings({ ...settings, enabled: true });
      await showAppNotification("Notifications activées", {
        body: `MyShift vous rappellera à ${settings.reminderTime} si votre journée manque.`,
        tag: "notifications-enabled",
      });
      setFeedback("Notification instantanée envoyée");
    } else {
      setFeedback("Autorisez les notifications dans les réglages de votre appareil.");
    }
  };

  const isEnabled = settings.enabled && permission === "granted";

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-3.5 py-5 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-zinc-400 transition active:scale-95"
          aria-label="Retour au tableau de bord"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">Notifications</h2>
          <p className="mt-0.5 text-[11px] text-zinc-500">Gérez vos alertes MyShift</p>
        </div>
      </div>

      <section aria-labelledby="notification-settings-title">
        <div className="rounded-2xl border border-white/[0.07] bg-[#171A20] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${isEnabled ? "border-sky-500/20 bg-sky-500/10 text-sky-400" : "border-white/[0.06] bg-white/[0.025] text-zinc-500"}`}>
            {isEnabled ? <Bell className="h-[18px] w-[18px]" /> : <BellOff className="h-[18px] w-[18px]" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="notification-settings-title" className="text-sm font-bold text-white">Rappel quotidien</h2>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                  Alerte si aucun shift n’est enregistré en fin de journée.
                </p>
              </div>
              {isEnabled && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-semibold text-emerald-400">
                  <Check className="h-3 w-3" /> Activé
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <label className="flex h-11 items-center gap-2 rounded-xl border border-white/[0.07] bg-[#101216] px-3 text-xs text-zinc-400 sm:w-36">
                <Clock3 className="h-3.5 w-3.5 text-zinc-600" />
                <input
                  type="time"
                  value={settings.reminderTime}
                  onChange={(event) => updateSettings({ ...settings, reminderTime: event.target.value })}
                  className="min-w-0 flex-1 bg-transparent text-base text-zinc-200 outline-none sm:text-sm"
                  aria-label="Heure du rappel quotidien"
                />
              </label>
              <button
                type="button"
                onClick={handleToggle}
                className={`min-h-11 w-full rounded-xl px-4 text-xs font-bold transition active:scale-[0.98] sm:w-auto sm:flex-1 ${isEnabled ? "border border-white/[0.07] bg-white/[0.03] text-zinc-300" : "bg-sky-500 text-sky-950 shadow-[0_8px_24px_rgba(14,165,233,0.16)]"}`}
              >
                {isEnabled ? "Désactiver" : "Activer les notifications"}
              </button>
            </div>

            {feedback && <p className={`mt-2 text-[10px] ${permission === "denied" ? "text-amber-400" : "text-zinc-500"}`}>{feedback}</p>}
          </div>
        </div>
        </div>
      </section>
    </main>
  );
};
