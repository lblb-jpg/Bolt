import { FormEvent, useState } from "react";
import { ArrowLeft, Car, KeyRound, LockKeyhole, UserRound } from "lucide-react";
import { profileSession, USER_PROFILES, UserProfile } from "../profileSession";

interface LoginScreenProps {
  onLogin: (profile: UserProfile) => void;
}

export const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const updatePin = (value: string, setter: (value: string) => void) => {
    setter(value.replace(/\D/g, "").slice(0, 5));
    setError("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProfile || pin.length !== 5) {
      setError("Saisissez un code PIN de 5 chiffres.");
      return;
    }
    setIsLoading(true);
    if (await profileSession.login(selectedProfile.id, pin)) {
      onLogin(selectedProfile);
    } else {
      setError("Code PIN incorrect.");
      setPin("");
    }
    setIsLoading(false);
  };

  return (
    <main className="app-shell flex min-h-full items-center justify-center px-4 py-[calc(2rem+env(safe-area-inset-top))] text-zinc-100">
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="brand-mark mx-auto flex h-14 w-14 items-center justify-center rounded-[20px]">
            <Car className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">MyShift</h1>
          <p className="mt-1 text-sm text-zinc-500">Connectez-vous à votre espace personnel</p>
        </div>

        {!selectedProfile ? (
          <div className="space-y-3">
            {USER_PROFILES.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => setSelectedProfile(profile)}
                className="glass-card flex min-h-20 w-full items-center gap-4 rounded-[22px] p-4 text-left transition active:scale-[0.99]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400">
                  <UserRound className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <strong className="block text-base text-white">{profile.name}</strong>
                  <span className="mt-0.5 block text-[11px] text-zinc-500">
                    Entrer le code PIN
                  </span>
                </span>
                <LockKeyhole className="h-4 w-4 text-zinc-600" />
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-card rounded-[28px] p-5 shadow-2xl shadow-black/20">
            <button
              type="button"
              onClick={() => { setSelectedProfile(null); setPin(""); setError(""); }}
              className="mb-5 flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Changer d’espace
            </button>

            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/[0.08] text-emerald-400">
                <KeyRound className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-bold text-white">{selectedProfile.name}</h2>
                <p className="text-[11px] text-zinc-500">Saisissez votre PIN à 5 chiffres</p>
              </div>
            </div>

            <label htmlFor="profile-pin" className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Code PIN</label>
            <input
              id="profile-pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={pin}
              onChange={(event) => updatePin(event.target.value, setPin)}
              className="min-h-14 w-full rounded-xl border border-white/10 bg-[#0F1115] px-4 text-center font-mono text-xl tracking-[0.55em] text-white outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
              placeholder="•••••"
              autoFocus
            />

            {error && <p className="mt-3 text-center text-xs text-rose-400">{error}</p>}

            <button
              type="submit"
              disabled={isLoading || pin.length !== 5}
              className="primary-action mt-5 min-h-12 w-full rounded-2xl text-sm font-bold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
};
