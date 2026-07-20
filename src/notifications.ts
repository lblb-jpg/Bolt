export const NOTIFICATION_SETTINGS_KEY = "myshift_notification_settings";
export const LAST_DAILY_REMINDER_KEY = "myshift_last_daily_reminder";
export const LAST_WEEKLY_REPORT_KEY = "myshift_last_weekly_report";

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: string;
}

export const defaultNotificationSettings: NotificationSettings = {
  enabled: false,
  reminderTime: "21:00",
};

export const getNotificationSettings = (): NotificationSettings => {
  try {
    const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return saved ? { ...defaultNotificationSettings, ...JSON.parse(saved) } : defaultNotificationSettings;
  } catch {
    return defaultNotificationSettings;
  }
};

export const saveNotificationSettings = (settings: NotificationSettings) => {
  localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent("myshift-notification-settings-changed", { detail: settings }));
};

export const getLocalDateKey = (date = new Date()) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, "0"),
  String(date.getDate()).padStart(2, "0"),
].join("-");

export const showAppNotification = async (title: string, options: NotificationOptions = {}) => {
  if (!("Notification" in window) || Notification.permission !== "granted") return false;

  const notificationOptions: NotificationOptions = {
    icon: "/icons/myshift-192.png",
    badge: "/icons/myshift-192.png",
    ...options,
  };

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, notificationOptions);
  } else {
    new Notification(title, notificationOptions);
  }

  return true;
};
