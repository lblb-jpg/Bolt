import { useCallback, useEffect, useState } from "react";
import { getCompletedWeeklySettlements } from "../earnings";
import {
  getLocalDateKey,
  getNotificationSettings,
  LAST_DAILY_REMINDER_KEY,
  LAST_WEEKLY_REPORT_KEY,
  NotificationSettings,
  showAppNotification,
} from "../notifications";
import { ShiftEntry } from "../types";

interface NotificationSchedulerProps {
  entries: ShiftEntry[];
}

export const NotificationScheduler = ({ entries }: NotificationSchedulerProps) => {
  const [settings, setSettings] = useState(getNotificationSettings);

  useEffect(() => {
    const handleSettingsChange = (event: Event) => {
      setSettings((event as CustomEvent<NotificationSettings>).detail);
    };
    window.addEventListener("myshift-notification-settings-changed", handleSettingsChange);
    return () => window.removeEventListener("myshift-notification-settings-changed", handleSettingsChange);
  }, []);

  const sendNotificationsIfNeeded = useCallback(async () => {
    if (!settings.enabled || !("Notification" in window) || Notification.permission !== "granted") return;

    const now = new Date();
    const today = getLocalDateKey(now);
    const currentTime = now.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const shiftIsSaved = entries.some((entry) => entry.date === today);
    const reminderAlreadySent = localStorage.getItem(LAST_DAILY_REMINDER_KEY) === today;

    if (currentTime >= settings.reminderTime && !shiftIsSaved && !reminderAlreadySent) {
      const sent = await showAppNotification("Votre journée n’est pas enregistrée", {
        body: "Ajoutez votre shift maintenant pour garder vos statistiques à jour.",
        tag: `daily-reminder-${today}`,
        requireInteraction: true,
      });
      if (sent) localStorage.setItem(LAST_DAILY_REMINDER_KEY, today);
    }

    if (now.getDay() === 1) {
      const latestWeek = getCompletedWeeklySettlements(entries, now)[0];
      const weeklyReportAlreadySent = latestWeek
        ? localStorage.getItem(LAST_WEEKLY_REPORT_KEY) === latestWeek.weekStart
        : true;

      if (latestWeek && !weeklyReportAlreadySent) {
        const formattedResult = new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
        }).format(latestWeek.totalAfterFee);
        const sent = await showAppNotification("Votre bilan hebdomadaire est prêt", {
          body: `${latestWeek.daysWorked} jour${latestWeek.daysWorked > 1 ? "s" : ""} travaillé${latestWeek.daysWorked > 1 ? "s" : ""} · bénéfice final ${formattedResult}.`,
          tag: `weekly-report-${latestWeek.weekStart}`,
        });
        if (sent) localStorage.setItem(LAST_WEEKLY_REPORT_KEY, latestWeek.weekStart);
      }
    }
  }, [entries, settings]);

  useEffect(() => {
    void sendNotificationsIfNeeded();
    const interval = window.setInterval(() => void sendNotificationsIfNeeded(), 30_000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void sendNotificationsIfNeeded();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [sendNotificationsIfNeeded]);

  return null;
};
