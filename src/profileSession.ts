export type UserProfile = {
  id: "principal" | "elyesse";
  name: string;
};

export const USER_PROFILES: UserProfile[] = [
  { id: "principal", name: "Mon espace" },
  { id: "elyesse", name: "Elyesse" },
];

const SESSION_KEY = "myshift_active_profile_v1";
const FIXED_PINS: Record<UserProfile["id"], string> = {
  principal: "13595",
  elyesse: "12345",
};

export const profileSession = {
  getActiveProfile(): UserProfile | null {
    const id = localStorage.getItem(SESSION_KEY);
    return USER_PROFILES.find((profile) => profile.id === id) ?? null;
  },

  async login(profileId: UserProfile["id"], pin: string) {
    if (FIXED_PINS[profileId] !== pin) return false;
    localStorage.setItem(SESSION_KEY, profileId);
    return true;
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },
};
