import { useState, useEffect } from "react";
import Skeleton from "../components/Skeleton";

interface CashoutRequestProps {
  onBack: () => void;
  onSearch: (amount: number) => void;
}

// ---------------------------------------------------------------------------
// Skeleton layout – mirrors the real content shape so there is no layout shift
// ---------------------------------------------------------------------------
function CashoutRequestSkeleton() {
  return (
    <div className="text-on-surface antialiased overflow-x-hidden min-h-screen bg-surface-container-low">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-low backdrop-blur-xl shadow-[0_32px_32px_rgba(0,105,76,0.04)]">
        <div className="flex items-center justify-between px-6 py-4 w-full">
          <div className="flex items-center gap-4">
            <div className="p-2">
              <span className="material-symbols-outlined font-bold text-primary">
                arrow_back
              </span>
            </div>
            <h1 className="font-headline font-bold text-xl tracking-tight text-primary">
              Convertir a efectivo
            </h1>
          </div>
          <div className="w-10" />
        </div>
        <div className="bg-outline-variant/30 h-[1px] w-full" />
      </header>

      <main
        className="pt-24 pb-32 px-6 flex flex-col min-h-screen max-w-md mx-auto"
        aria-busy="true"
        aria-label="Cargando…"
      >
        {/* Label placeholder */}
        <div className="mt-8 mb-4">
          <Skeleton className="h-3 w-52" />
        </div>

        {/* Amount input card placeholder */}
        <div className="relative mb-8 py-10 px-4 bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/10 flex flex-col items-center gap-6">
          {/* Big amount display */}
          <div className="flex items-center justify-center gap-3 w-full">
            <Skeleton className="h-12 w-8" />
            <Skeleton className="h-14 w-32" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
          {/* Availability chip */}
          <Skeleton className="h-8 w-48 rounded-full" />
        </div>

        {/* Info cards placeholder */}
        <div className="space-y-6">
          <div className="p-6 bg-surface-container-low rounded-2xl border-l-4 border-primary/20">
            <div className="flex gap-4">
              <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
              <Skeleton.Text lines={3} className="flex-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="bg-surface-container-highest/30 p-4 rounded-2xl flex flex-col gap-2"
              >
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* CTA button placeholder */}
        <div className="mt-auto pt-10 pb-6">
          <Skeleton className="h-[56px] w-full rounded-xl" />
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state – minimal but informative
// ---------------------------------------------------------------------------
function CashoutRequestError({ onBack }: { onBack: () => void }) {
  return (
    <div className="text-on-surface antialiased overflow-x-hidden min-h-screen bg-surface-container-low">
      <header className="fixed top-0 w-full z-50 bg-surface-container-low backdrop-blur-xl shadow-[0_32px_32px_rgba(0,105,76,0.04)]">
        <div className="flex items-center justify-between px-6 py-4 w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-primary active:scale-95 duration-200 p-2 hover:bg-primary/10 rounded-full"
            >
              <span className="material-symbols-outlined font-bold">
                arrow_back
              </span>
            </button>
            <h1 className="font-headline font-bold text-xl tracking-tight text-primary">
              Convertir a efectivo
            </h1>
          </div>
          <div className="w-10" />
        </div>
        <div className="bg-outline-variant/30 h-[1px] w-full" />
      </header>

      <main className="pt-24 pb-32 px-6 flex flex-col items-center justify-center min-h-[60vh] text-center gap-4 max-w-md mx-auto">
        <span className="material-symbols-outlined text-error text-5xl">
          wifi_off
        </span>
        <h2 className="font-headline font-bold text-xl text-on-surface">
          No pudimos cargar la pantalla
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
const CashoutRequest = ({ onBack, onSearch }: CashoutRequestProps) => {
  const [amount, setAmount] = useState("500");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Simulate initial data fetch (balance, user context, etc.).
  // In production this would gate on a real async call.
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return <CashoutRequestSkeleton />;
  if (hasError) return <CashoutRequestError onBack={onBack} />;

  return (
    <div className="text-on-surface antialiased overflow-x-hidden min-h-screen bg-surface-container-low">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-low backdrop-blur-xl shadow-[0_32px_32px_rgba(0,105,76,0.04)]">
        <div className="flex items-center justify-between px-6 py-4 w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-primary active:scale-95 duration-200 p-2 hover:bg-primary/10 rounded-full"
            >
              <span className="material-symbols-outlined font-bold">
                arrow_back
              </span>
            </button>
            <h1 className="font-headline font-bold text-xl tracking-tight text-primary">
              Convertir a efectivo
            </h1>
          </div>
          <div className="w-10"></div>
        </div>
        <div className="bg-outline-variant/30 h-[1px] w-full self-end"></div>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-24 pb-32 px-6 flex flex-col min-h-screen max-w-md mx-auto">
        {/* Section: Input Header */}
        <div className="mt-8 mb-4">
          <label className="font-label text-xs font-bold tracking-[0.15em] text-on-surface-variant opacity-70">
            ¿CUÁNTO QUIERES EN EFECTIVO?
          </label>
        </div>

        {/* Section: Amount Input & Display */}
        <div className="relative group mb-8 py-10 px-4 bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/10 flex flex-col items-center">
          <div className="flex items-center justify-center gap-3 w-full">
            <span className="text-headline text-4xl font-extrabold text-on-surface">
              $
            </span>
            <input
              className="w-32 text-headline text-5xl font-extrabold text-on-surface bg-transparent border-none focus:ring-0 p-0 text-center"
              placeholder="0"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <span className="text-label text-xl font-bold text-primary px-3 py-1 bg-primary/5 rounded-lg">
              MXN
            </span>
          </div>
          {/* Availability Chip */}
          <div className="mt-8 flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/10">
            <span
              className="material-symbols-outlined text-primary text-sm font-bold"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              account_balance_wallet
            </span>
            <span className="text-label text-[13px] font-bold text-primary">
              Disponible: $1,240.00 MXN
            </span>
          </div>
        </div>

        {/* Section: Information & Bento Details */}
        <div className="space-y-6">
          <div className="p-6 bg-surface-container-low rounded-2xl border-l-4 border-primary/20">
            <div className="flex gap-4">
              <span className="material-symbols-outlined text-primary opacity-60">
                info
              </span>
              <p className="text-body text-[14px] leading-relaxed text-on-surface-variant font-medium">
                Ingresa el monto que deseas recibir. Buscaremos a los agentes
                verificados más cercanos con liquidez inmediata.
              </p>
            </div>
          </div>
          {/* Visual Context / Editorial Card */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-highest/30 p-4 rounded-2xl flex flex-col gap-2">
              <span className="material-symbols-outlined text-primary">
                location_on
              </span>
              <span className="text-xs font-bold text-on-surface-variant">
                UBICACIÓN
              </span>
              <span className="text-sm font-semibold text-on-surface">
                Cerca de ti
              </span>
            </div>
            <div className="bg-surface-container-highest/30 p-4 rounded-2xl flex flex-col gap-2">
              <span className="material-symbols-outlined text-primary">
                speed
              </span>
              <span className="text-xs font-bold text-on-surface-variant">
                TIEMPO
              </span>
              <span className="text-sm font-semibold text-on-surface">
                &lt; 15 mins
              </span>
            </div>
          </div>
        </div>

        {/* Action Area */}
        <div className="mt-auto pt-10 pb-6">
          <button
            onClick={() => onSearch(Number(amount))}
            className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-body font-semibold py-4 rounded-xl shadow-[0_12px_24px_rgba(0,105,76,0.2)] active:scale-95 duration-200 transition-all flex items-center justify-center gap-3"
          >
            <span>Buscar ofertas de efectivo</span>
            <span className="material-symbols-outlined text-lg">search</span>
          </button>
        </div>
      </main>

      {/* Background Decoration */}
      <div className="fixed top-0 right-0 -z-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-primary-container/5 rounded-full blur-3xl -ml-48 -mb-48"></div>
    </div>
  );
};

export default CashoutRequest;
