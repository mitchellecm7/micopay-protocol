import { useEffect, useState } from 'react';
import { getMyProfile, getMerchantConfig, MerchantConfig, UserProfile } from '../services/api';

interface ProfileProps {
  token: string | null;
  onOpenMerchantSettings: () => void;
}

export default function Profile({ token, onOpenMerchantSettings }: ProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [merchantConfig, setMerchantConfig] = useState<MerchantConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    Promise.all([getMyProfile(token), getMerchantConfig(token)])
      .then(([user, config]) => {
        setProfile(user);
        setMerchantConfig(config);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const card = merchantConfig
    ? {
        rate: merchantConfig.rate_percent ?? 1,
        min: merchantConfig.min_trade_mxn ?? 100,
        max: merchantConfig.max_trade_mxn ?? 50000,
        cap: merchantConfig.daily_cap_mxn ?? 250000,
      }
    : { rate: 1, min: 100, max: 50000, cap: 250000 };

  return (
    <div className="bg-surface text-on-surface min-h-screen px-6 pt-10 pb-28 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Perfil</h1>
      <p className="text-sm text-on-surface-variant mb-6">Tarjeta de comerciante (solo lectura)</p>

      {loading ? <p>Cargando…</p> : (
        <div className="rounded-2xl border border-slate-200 p-5 bg-white space-y-3">
          <p className="font-semibold">{profile?.username ?? 'Comerciante'}</p>
          <p className="text-sm">Tasa: <strong>{card.rate}%</strong></p>
          <p className="text-sm">Rango: <strong>${card.min} - ${card.max} MXN</strong></p>
          <p className="text-sm">Tope diario: <strong>${card.cap} MXN</strong></p>
          <p className="text-xs text-on-surface-variant">Reinicio del tope diario: 00:00 UTC.</p>
        </div>
      )}

      <button
        className="mt-6 w-full rounded-xl bg-primary text-white font-semibold py-3"
        onClick={onOpenMerchantSettings}
      >
        Editar límites y tasa
      </button>
    </div>
  );
}
