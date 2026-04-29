import { useState, useEffect } from "react";
import MapSim from "../components/MapSim";
import Skeleton from "../components/Skeleton";
import MerchantCard, {
  type MerchantCardData,
} from "../components/MerchantCard";

interface ExploreMapProps {
  onBack: () => void;
  onSelectOffer: (offerId: string) => void;
  amount?: number;
  loading?: boolean;
}

// ─── fixtures ────────────────────────────────────────────────────────────────
// Three representative merchants covering the full badge spectrum.
// In production these come from GET /api/v1/cash/agents.

function buildMerchants(amount: number): MerchantCardData[] {
  const fee1 = 0.01;
  const fee2 = 0.02;
  const fee3 = 0.015;

  return [
    {
      id: "offer_1",
      name: "Farmacia Guadalupe",
      type: "farmacia",
      address: "Orizaba 45, Col. Roma Norte, CDMX",
      distance_km: 0.18,
      payout_mxn: parseFloat((amount * (1 - fee1)).toFixed(2)),
      fee_pct: fee1 * 100,
      hours: "8:00 – 22:00",
      completion_rate: 0.98,
      trades_completed: 312,
      avg_time_minutes: 4,
      tier: "maestro",
      online: true,
      verification: "verified",
    },
    {
      id: "offer_2",
      name: "Tienda Don Pepe",
      type: "tienda",
      address: "Av. Álvaro Obregón 120, Col. Roma Norte",
      distance_km: 0.54,
      payout_mxn: parseFloat((amount * (1 - fee2)).toFixed(2)),
      fee_pct: fee2 * 100,
      hours: "9:00 – 20:00",
      completion_rate: 0.93,
      trades_completed: 8,
      avg_time_minutes: 7,
      tier: "espora",
      online: true,
      verification: "new",
    },
    {
      id: "offer_3",
      name: "Papelería La Central",
      type: "papeleria",
      address: "Col. Condesa, CDMX",
      distance_km: 1.1,
      payout_mxn: parseFloat((amount * (1 - fee3)).toFixed(2)),
      fee_pct: fee3 * 100,
      hours: "10:00 – 18:00",
      completion_rate: 0.88,
      trades_completed: 45,
      avg_time_minutes: 5,
      tier: "activo",
      online: false,
      verification: "paused",
    },
  ];
}

// ---------------------------------------------------------------------------
// Skeleton layout – mirrors the real content shape so there is no layout shift
// ---------------------------------------------------------------------------
function ExploreMapSkeleton() {
  return (
    <div className="bg-surface-container-lowest text-on-surface font-body min-h-screen pb-24">
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 py-4 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-center p-2 rounded-full">
          <span className="material-symbols-outlined text-primary">
            arrow_back
          </span>
        </div>
        <h1 className="ml-4 font-headline font-bold text-xl text-primary tracking-tight">
          Convertir a efectivo
        </h1>
      </header>

      <main
        className="pt-24 px-6 max-w-2xl mx-auto"
        aria-busy="true"
        aria-label="Cargando ofertas…"
      >
        {/* Map placeholder – same h-64 as MapSim */}
        <section className="mb-10">
          <Skeleton.Card className="h-64" />
        </section>

        {/* Results header placeholder */}
        <div className="mb-6 space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-28" />
        </div>

        {/* Primary offer card skeleton */}
        <div className="space-y-4">
          <div className="bg-surface p-6 rounded-[24px] border border-primary-container/10 shadow-[0_4px_24px_rgba(0,133,96,0.06)] space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-32 rounded-full" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton.Avatar size="lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-2xl">
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-28" />
              </div>
              <div className="space-y-1 flex flex-col items-end">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <Skeleton className="h-[52px] w-full rounded-xl" />
          </div>

          {/* Secondary offer card skeletons */}
          {[0, 1].map((i) => (
            <div
              key={i}
              className="bg-surface-container-low/30 p-5 rounded-[24px] border border-transparent space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton.Avatar size="md" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="space-y-1 flex flex-col items-end">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state – minimal but informative
// ---------------------------------------------------------------------------
function ExploreMapError({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-surface-container-lowest text-on-surface font-body min-h-screen pb-24">
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 py-4 bg-white/80 backdrop-blur-md shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center justify-center p-2 rounded-full hover:bg-surface-container-low transition-colors duration-200"
        >
          <span className="material-symbols-outlined text-primary">
            arrow_back
          </span>
        </button>
        <h1 className="ml-4 font-headline font-bold text-xl text-primary tracking-tight">
          Convertir a efectivo
        </h1>
      </header>

      <main className="pt-24 px-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <span className="material-symbols-outlined text-error text-5xl">
          wifi_off
        </span>
        <h2 className="font-headline font-bold text-xl text-on-surface">
          No pudimos cargar las ofertas
        </h2>
        <p className="text-sm text-outline font-medium max-w-xs">
          Revisa tu conexión e intenta de nuevo.
        </p>
        <button
          onClick={onBack}
          className="mt-2 px-6 py-3 bg-primary text-white font-bold rounded-xl active:scale-95 transition-all"
        >
          Volver
        </button>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const ExploreMap = ({
  onBack,
  onSelectOffer,
  amount = 500,
  loading = false,
}: ExploreMapProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Simulate the initial data-fetch delay so the skeleton is visible while
  // the map image and offer data resolve. In production this would gate on
  // a real async call; here we mirror the pattern used across the app.
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [amount]);

  if (isLoading) return <ExploreMapSkeleton />;
  if (hasError) return <ExploreMapError onBack={onBack} />;

  const merchants = buildMerchants(amount);

  return (
    <div className="bg-surface-container-lowest text-on-surface font-body min-h-screen pb-24">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 py-4 bg-white/80 backdrop-blur-md shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center justify-center p-2 rounded-full hover:bg-surface-container-low transition-colors duration-200"
          aria-label="Volver"
        >
          <span className="material-symbols-outlined text-primary">
            arrow_back
          </span>
        </button>
        <h1 className="ml-4 font-headline font-bold text-xl text-primary tracking-tight">
          Convertir a efectivo
        </h1>
      </header>

      <main className="pt-24 px-6 max-w-2xl mx-auto">
        {/* Map Section */}
        <section className="mb-10">
          <MapSim />
        </section>

        {/* Results Header */}
        <div className="mb-6">
          <h2 className="font-headline font-bold text-2xl text-on-surface">
            {merchants.filter((m) => m.online).length} ofertas para ${amount}{" "}
            MXN
          </h2>
          <div className="flex items-center gap-1 mt-1">
            <span className="material-symbols-outlined text-primary text-sm">
              location_on
            </span>
            <p className="text-sm text-outline font-medium">Zona Centro</p>
          </div>
        </div>

        {/* Merchant Cards */}
        <div className="space-y-4">
          {merchants.map((merchant, index) => (
            <MerchantCard
              key={merchant.id}
              merchant={merchant}
              isBestOffer={index === 0}
              onSelect={onSelectOffer}
              loading={loading}
            />
          ))}
        </div>

        {/* Footer Note */}
        <footer className="mt-10 mb-8 p-6 text-center">
          <p className="text-[12px] leading-relaxed text-outline font-medium">
            Tu saldo se bloquea en garantía hasta que confirmes la recepción del
            efectivo. Operación segura y protegida por MicoPay Smart Escrow.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default ExploreMap;
