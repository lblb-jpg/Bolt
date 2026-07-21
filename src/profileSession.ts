export type UserProfile = {
  id: "principal" | "elyesse";
  name: string;
};

export const USER_PROFILES: UserProfile[] = [
  { id: "principal", name: "Mon espace" },
  { id: "elyesse", name: "Elyesse" },
];

const PINS_KEY = "myshift_profile_pins_v1";
const SESSION_KEY = "myshift_active_profile_v1";

const getPinHashes = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(PINS_KEY) ?? "{}");
  } catch {
    return {};
  }
};

const hashPin = async (profileId: string, pin: string) => {
  const bytes = new TextEncoder().encode(`myshift:${profileId}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export const profileSession = {
  getActiveProfile(): UserProfile | null {
    const id = localStorage.getItem(SESSION_KEY);
    return USER_PROFILES.find((profile) => profile.id === id) ?? null;
  },

  hasPin(profileId: UserProfile["id"]) {
    return Boolean(getPinHashes()[profileId]);
  },

  async createPin(profileId: UserProfile["id"], pin: string) {
    const hashes = getPinHashes();
    hashes[profileId] = await hashPin(profileId, pin);
    localStorage.setItem(PINS_KEY, JSON.stringify(hashes));
    localStorage.setItem(SESSION_KEY, profileId);
  },

  async login(profileId: UserProfile["id"], pin: string) {
    const expectedHash = getPinHashes()[profileId];
    if (!expectedHash || expectedHash !== await hashPin(profileId, pin)) return false;
    localStorage.setItem(SESSION_KEY, profileId);
    return true;
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },
};
