/**
 * MerchantCard — trust-signal-first merchant profile card.
 *
 * Three verification states:
 *   verified  — established merchant, high completion rate
 *   new       — fewer than 20 trades, building reputation
 *   paused    — currently offline / not accepting trades
 *
 * Designed to be calm and informative (UX_MANIFESTO):
 * no decorative gradients, no star ratings out of 5 — just the
 * numbers that actually matter at the moment of trust.
 */

export type VerificationStatus = "verified" | "new" | "paused";

export interface MerchantCardData {
  id: string;
  name: string;
  type: string;
  address: string;
  distance_km: number;
  /** Amount user receives in MXN */
  payout_mxn: number;
  /** Fee as a percentage, e.g. 1.0 = 1% */
  fee_pct: number;
  /** Operating hours string, e.g. "8:00 – 21:00" */
  hours?: string;
  /** 0–1, e.g. 0.98 */
  completion_rate: number;
  trades_completed: number;
  avg_time_minutes: number;
  tier: "maestro" | "experto" | "activo" | "espora";
  online: boolean;
  /** Derived from trades_completed + online status */
  verification: VerificationStatus;
}

interface MerchantCardProps {
  merchant: MerchantCardData;
  /** Whether this card is the top-ranked / best offer */
  isBestOffer?: boolean;
  onSelect: (id: string) => void;
  loading?: boolean;
}

// ─── helpers ────────────────────────────────────────────────────────────────

const TIER_META: Record<
  MerchantCardData["tier"],
  { emoji: string; label: string }
> = {
  maestro: { emoji: "🍄", label: "Maestro" },
  experto: { emoji: "⭐", label: "Experto" },
  activo: { emoji: "✅", label: "Activo" },
  espora: { emoji: "🌱", label: "Espora" },
};

const MERCHANT_ICON: Record<string, string> = {
  farmacia: "local_pharmacy",
  tienda: "storefront",
  papeleria: "edit_note",
  consultorio: "medical_services",
  lavanderia: "local_laundry_service",
  default: "storefront",
};

function merchantIcon(type: string): string {
  return MERCHANT_ICON[type.toLowerCase()] ?? MERCHANT_ICON.default;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function walkMinutes(km: number): number {
  // ~5 km/h walking pace
  return Math.max(1, Math.round((km / 5) * 60));
}

// ─── badge ──────────────────────────────────────────────────────────────────

interface BadgeProps {
  status: VerificationStatus;
}

function VerificationBadge({ status }: BadgeProps) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold tracking-wide">
        <span
          className="material-symbols-outlined text-[13px]"
          style={{ fontVariationSettings: '"FILL" 1' }}
        >
          verified
        </span>
        Verificado
      </span>
    );
  }

  if (status === "new") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold tracking-wide border border-amber-200">
        <span className="material-symbols-outlined text-[13px]">
          new_releases
        </span>
        Nuevo
      </span>
    );
  }

  // paused
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-outline text-[11px] font-bold tracking-wide">
      <span className="material-symbols-outlined text-[13px]">
        pause_circle
      </span>
      Pausado
    </span>
  );
}

// ─── stat pill ───────────────────────────────────────────────────────────────

interface StatProps {
  icon: string;
  value: string;
  label: string;
  highlight?: boolean;
}

function Stat({ icon, value, label, highlight }: StatProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-0">
      <span
        className={`material-symbols-outlined text-[18px] ${highlight ? "text-primary" : "text-outline"}`}
      >
        {icon}
      </span>
      <span
        className={`font-headline font-bold text-sm leading-none ${highlight ? "text-primary" : "text-on-surface"}`}
      >
        {value}
      </span>
      <span className="text-[10px] text-outline font-medium leading-none text-center">
        {label}
      </span>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export default function MerchantCard({
  merchant,
  isBestOffer = false,
  onSelect,
  loading = false,
}: MerchantCardProps) {
  const tier = TIER_META[merchant.tier];
  const isPaused = merchant.verification === "paused";

  return (
    <article
      className={[
        "relative bg-surface rounded-[24px] overflow-hidden transition-all duration-200",
        isPaused
          ? "opacity-60 border border-outline-variant/30"
          : isBestOffer
            ? "border border-primary/20 shadow-[0_4px_24px_rgba(0,105,76,0.10)]"
            : "border border-outline-variant/20 hover:border-primary/20 hover:shadow-sm",
      ].join(" ")}
    >
      {/* Best-offer accent bar */}
      {isBestOffer && !isPaused && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary rounded-t-[24px]" />
      )}

      <button
        className="w-full text-left p-5 disabled:cursor-not-allowed"
        onClick={() => !isPaused && onSelect(merchant.id)}
        disabled={isPaused || loading}
        aria-label={`Seleccionar ${merchant.name}`}
      >
        {/* ── Row 1: header ── */}
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* Icon + name */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                isBestOffer && !isPaused
                  ? "bg-primary/10"
                  : "bg-surface-container-high"
              }`}
            >
              <span
                className={`material-symbols-outlined text-2xl ${
                  isBestOffer && !isPaused ? "text-primary" : "text-outline"
                }`}
              >
                {merchantIcon(merchant.type)}
              </span>
            </div>

            <div className="min-w-0">
              <h3 className="font-headline font-bold text-base text-on-surface leading-tight truncate">
                {merchant.name}
              </h3>
              <p className="text-[12px] text-outline font-medium flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[13px]">
                  directions_walk
                </span>
                {formatDistance(merchant.distance_km)} ·{" "}
                {walkMinutes(merchant.distance_km)} min
                {merchant.hours && (
                  <>
                    <span className="text-outline-variant mx-1">·</span>
                    <span className="material-symbols-outlined text-[13px]">
                      schedule
                    </span>
                    {merchant.hours}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <VerificationBadge status={merchant.verification} />
            <span className="text-[11px] text-outline font-medium">
              {tier.emoji} {tier.label}
            </span>
          </div>
        </div>

        {/* ── Row 2: payout ── */}
        <div className="flex items-center justify-between mb-4 px-4 py-3 bg-surface-container-lowest rounded-2xl border border-outline-variant/10">
          <div>
            <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">
              Recibes
            </p>
            <p
              className={`text-2xl font-headline font-extrabold leading-none ${
                isPaused ? "text-outline" : "text-[#00A878]"
              }`}
            >
              ${merchant.payout_mxn.toFixed(2)}{" "}
              <span className="text-sm font-bold text-outline">MXN</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">
              Comisión
            </p>
            <p className="text-sm font-bold text-on-surface">
              {merchant.fee_pct.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* ── Row 3: trust stats ── */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Stat
            icon="check_circle"
            value={`${Math.round(merchant.completion_rate * 100)}%`}
            label="Completados"
            highlight={merchant.completion_rate >= 0.9}
          />
          <Stat
            icon="swap_horiz"
            value={merchant.trades_completed.toString()}
            label="Intercambios"
          />
          <Stat
            icon="timer"
            value={`${merchant.avg_time_minutes} min`}
            label="Tiempo prom."
          />
        </div>

        {/* ── Row 4: CTA ── */}
        {!isPaused && (
          <div
            className={`w-full h-[48px] rounded-xl flex items-center justify-center gap-2 font-headline font-bold text-sm transition-all ${
              isBestOffer
                ? "bg-primary text-white shadow-md shadow-primary/20 active:scale-[0.98]"
                : "border border-primary text-primary active:scale-[0.98]"
            } ${loading ? "opacity-70" : ""}`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Preparando escrow...
              </>
            ) : isBestOffer ? (
              <>
                Ir con este agente
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </>
            ) : (
              "Ver oferta"
            )}
          </div>
        )}

        {isPaused && (
          <p className="text-center text-[12px] text-outline font-medium py-2">
            No disponible en este momento
          </p>
        )}
      </button>
    </article>
  );
}
