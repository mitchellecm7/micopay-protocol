import { useState } from "react";
import { registerMerchant, MerchantData } from "../services/api";

interface MerchantOnboardingProps {
  token: string;
  onComplete?: () => void;
}

interface FormState {
  display_name: string;
  address_text: string;
  latitude: string;
  longitude: string;
  hours_open: string;
  hours_close: string;
  base_rate: string;
  spread_percent: string;
  min_amount: string;
  max_amount: string;
}

type VerificationStatus = "pending" | "verified" | "paused";

const STATUS_LABEL: Record<VerificationStatus, string> = {
  pending: "En revisión",
  verified: "Verificado",
  paused: "Pausado",
};

const INITIAL_FORM: FormState = {
  display_name: "",
  address_text: "",
  latitude: "",
  longitude: "",
  hours_open: "",
  hours_close: "",
  base_rate: "",
  spread_percent: "",
  min_amount: "",
  max_amount: "",
};

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function MerchantOnboarding({
  token,
  onComplete,
}: MerchantOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registered, setRegistered] = useState<
    (MerchantData & { verification_status: VerificationStatus }) | null
  >(null);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  // ── Validation ────────────────────────────────────────────────────────────

  function validateStep1(): boolean {
    const e: Partial<FormState> = {};
    if (!form.display_name.trim()) e.display_name = "El nombre es obligatorio.";
    else if (form.display_name.length > 60)
      e.display_name = "Máximo 60 caracteres.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2(): boolean {
    const e: Partial<FormState> = {};
    if (!form.address_text.trim())
      e.address_text = "La dirección es obligatoria.";
    if (!form.latitude.trim()) e.latitude = "La latitud es obligatoria.";
    else if (isNaN(Number(form.latitude)))
      e.latitude = "Debe ser un número válido.";
    if (!form.longitude.trim()) e.longitude = "La longitud es obligatoria.";
    else if (isNaN(Number(form.longitude)))
      e.longitude = "Debe ser un número válido.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep3(): boolean {
    const e: Partial<FormState> = {};
    if (!form.hours_open) e.hours_open = "La hora de apertura es obligatoria.";
    else if (!HH_MM.test(form.hours_open))
      e.hours_open = "Formato HH:MM requerido.";
    if (!form.hours_close) e.hours_close = "La hora de cierre es obligatoria.";
    else if (!HH_MM.test(form.hours_close))
      e.hours_close = "Formato HH:MM requerido.";
    if (!form.base_rate.trim()) e.base_rate = "La tasa base es obligatoria.";
    else if (isNaN(Number(form.base_rate)))
      e.base_rate = "Debe ser un número válido.";
    if (form.spread_percent.trim() === "")
      e.spread_percent = "El margen es obligatorio.";
    else if (isNaN(Number(form.spread_percent)))
      e.spread_percent = "Debe ser un número válido.";
    else if (Number(form.spread_percent) < 0)
      e.spread_percent = "El margen no puede ser negativo.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep4(): boolean {
    const e: Partial<FormState> = {};
    const min = Number(form.min_amount);
    const max = Number(form.max_amount);
    if (!form.min_amount.trim()) e.min_amount = "El mínimo es obligatorio.";
    else if (isNaN(min) || min <= 0) e.min_amount = "Debe ser mayor a 0 MXN.";
    if (!form.max_amount.trim()) e.max_amount = "El máximo es obligatorio.";
    else if (isNaN(max)) e.max_amount = "Debe ser un número válido.";
    else if (!e.min_amount && max <= min)
      e.max_amount = "Debe ser mayor al monto mínimo.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function advance() {
    const validators: Record<number, () => boolean> = {
      1: validateStep1,
      2: validateStep2,
      3: validateStep3,
      4: validateStep4,
    };
    const validate = validators[currentStep];
    if (validate && !validate()) return;
    if (currentStep === 4) {
      submit();
      return;
    }
    setCurrentStep((s) => s + 1);
  }

  function back() {
    setErrors({});
    setCurrentStep((s) => Math.max(0, s - 1));
  }

  // ── Submission ────────────────────────────────────────────────────────────

  async function submit() {
    setLoading(true);
    setSubmitError(null);
    try {
      const result = await registerMerchant(
        {
          display_name: form.display_name.trim(),
          address_text: form.address_text.trim(),
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          hours_open: form.hours_open,
          hours_close: form.hours_close,
          base_rate: Number(form.base_rate),
          spread_percent: Number(form.spread_percent),
          min_amount: Number(form.min_amount),
          max_amount: Number(form.max_amount),
        },
        token,
      );
      setRegistered({
        ...result,
        verification_status: result.verification_status ?? "pending",
      });
      setCurrentStep(5);
      onComplete?.();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        setSubmitError(
          "Ya tienes un registro pendiente o activo como comerciante.",
        );
      } else {
        const msg =
          err?.response?.data?.message ??
          err?.message ??
          "Ocurrió un error inesperado.";
        setSubmitError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Spread preview ────────────────────────────────────────────────────────

  function spreadPreview(): string | null {
    const base = Number(form.base_rate);
    const spread = Number(form.spread_percent);
    if (
      !form.base_rate ||
      !form.spread_percent ||
      isNaN(base) ||
      isNaN(spread) ||
      spread < 0
    )
      return null;
    const effective = base * (1 - spread / 100);
    return `Si tu tasa base es ${base.toFixed(2)} y tu margen es ${spread}%, el usuario recibirá ${effective.toFixed(2)} por dólar.`;
  }

  // ── Shared UI helpers ─────────────────────────────────────────────────────

  const inputClass = (field: keyof FormState) =>
    `w-full border rounded-xl px-4 py-3 text-sm font-body text-on-surface bg-white focus:outline-none focus:ring-2 focus:ring-primary transition ${
      errors[field] ? "border-error ring-1 ring-error" : "border-outline/30"
    }`;

  function FieldError({ field }: { field: keyof FormState }) {
    return errors[field] ? (
      <p className="text-xs text-error mt-1">{errors[field]}</p>
    ) : null;
  }

  function StepIndicator() {
    if (currentStep < 1 || currentStep > 4) return null;
    return (
      <p className="text-xs font-bold text-outline uppercase tracking-widest mb-6">
        Paso {currentStep} de 4
      </p>
    );
  }

  function NavButtons({ nextLabel = "Continuar" }: { nextLabel?: string }) {
    return (
      <div className="flex gap-3 mt-8">
        {currentStep > 0 && (
          <button
            onClick={back}
            className="flex-1 h-[52px] border border-outline/30 rounded-xl text-sm font-bold text-on-surface bg-white active:scale-95 transition-all"
          >
            Atrás
          </button>
        )}
        <button
          onClick={advance}
          disabled={loading}
          className="flex-1 h-[52px] bg-primary text-white rounded-xl text-sm font-bold active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && (
            <span className="material-symbols-outlined text-base animate-spin">
              progress_activity
            </span>
          )}
          {nextLabel}
        </button>
      </div>
    );
  }

  // ── Steps ─────────────────────────────────────────────────────────────────

  function renderStep() {
    switch (currentStep) {
      // Step 0 — Intro
      case 0:
        return (
          <div className="flex flex-col gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">
                storefront
              </span>
            </div>
            <div>
              <h1 className="font-headline font-extrabold text-2xl text-on-surface leading-tight mb-3">
                Regístrate como comerciante
              </h1>
              <p className="text-sm text-outline leading-relaxed mb-4">
                Como comerciante en MicoPay, ofreces servicios de cambio de
                efectivo a usuarios cercanos. Tú defines tu horario, tu tasa y
                los montos que manejas.
              </p>
              <p className="text-sm text-outline leading-relaxed mb-4">
                Tu solicitud será revisada por nuestro equipo antes de aparecer
                en el mapa. Este proceso puede tomar uno o dos días hábiles.
              </p>
              <div className="bg-surface-container-low rounded-2xl p-4 flex gap-3">
                <span className="material-symbols-outlined text-primary text-xl flex-shrink-0 mt-0.5">
                  info
                </span>
                <p className="text-xs text-on-surface leading-relaxed">
                  Solo necesitarás tu nombre de negocio, ubicación, horario y
                  las condiciones de cambio que ofreces. El proceso toma menos
                  de 5 minutos.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentStep(1)}
              className="w-full h-[52px] bg-primary text-white rounded-xl text-sm font-bold active:scale-95 transition-all"
            >
              Comenzar
            </button>
          </div>
        );

      // Step 1 — Identity
      case 1:
        return (
          <div className="flex flex-col gap-4">
            <StepIndicator />
            <h2 className="font-headline font-extrabold text-xl text-on-surface">
              ¿Cómo se llama tu negocio?
            </h2>
            <p className="text-sm text-outline leading-relaxed">
              Este nombre aparecerá en el mapa para que los usuarios te
              encuentren. Usa el nombre con el que te conocen.
            </p>
            <div>
              <div className="relative">
                <input
                  type="text"
                  value={form.display_name}
                  onChange={(e) => set("display_name", e.target.value)}
                  maxLength={60}
                  placeholder="Ej. Casa de Cambio Juárez"
                  className={inputClass("display_name")}
                />
                <span
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono ${form.display_name.length > 55 ? "text-error" : "text-outline"}`}
                >
                  {form.display_name.length}/60
                </span>
              </div>
              <FieldError field="display_name" />
            </div>
            <NavButtons />
          </div>
        );

      // Step 2 — Location
      case 2:
        return (
          <div className="flex flex-col gap-4">
            <StepIndicator />
            <h2 className="font-headline font-extrabold text-xl text-on-surface">
              ¿Dónde estás ubicado?
            </h2>
            <p className="text-sm text-outline leading-relaxed">
              Tu ubicación permite que los usuarios cercanos te encuentren. Solo
              compartimos tu posición con personas que buscan activamente un
              comerciante.
            </p>
            <div>
              <label className="text-xs font-bold text-outline uppercase tracking-wider mb-1 block">
                Dirección
              </label>
              <input
                type="text"
                value={form.address_text}
                onChange={(e) => set("address_text", e.target.value)}
                placeholder="Ej. Av. Insurgentes Sur 1234, CDMX"
                className={inputClass("address_text")}
              />
              <FieldError field="address_text" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-outline uppercase tracking-wider mb-1 block">
                  Latitud
                </label>
                <input
                  type="number"
                  value={form.latitude}
                  onChange={(e) => set("latitude", e.target.value)}
                  placeholder="19.4326"
                  step="any"
                  className={inputClass("latitude")}
                />
                <FieldError field="latitude" />
              </div>
              <div>
                <label className="text-xs font-bold text-outline uppercase tracking-wider mb-1 block">
                  Longitud
                </label>
                <input
                  type="number"
                  value={form.longitude}
                  onChange={(e) => set("longitude", e.target.value)}
                  placeholder="-99.1332"
                  step="any"
                  className={inputClass("longitude")}
                />
                <FieldError field="longitude" />
              </div>
            </div>
            <NavButtons />
          </div>
        );

      // Step 3 — Hours & Rate
      case 3: {
        const preview = spreadPreview();
        return (
          <div className="flex flex-col gap-4">
            <StepIndicator />
            <h2 className="font-headline font-extrabold text-xl text-on-surface">
              Horario y tasa de cambio
            </h2>
            <p className="text-sm text-outline leading-relaxed">
              Define cuándo atiendes y a qué tasa operas. Tu margen es la
              diferencia entre tu tasa base y lo que recibe el usuario.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-outline uppercase tracking-wider mb-1 block">
                  Apertura
                </label>
                <input
                  type="time"
                  value={form.hours_open}
                  onChange={(e) => set("hours_open", e.target.value)}
                  className={inputClass("hours_open")}
                />
                <FieldError field="hours_open" />
              </div>
              <div>
                <label className="text-xs font-bold text-outline uppercase tracking-wider mb-1 block">
                  Cierre
                </label>
                <input
                  type="time"
                  value={form.hours_close}
                  onChange={(e) => set("hours_close", e.target.value)}
                  className={inputClass("hours_close")}
                />
                <FieldError field="hours_close" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-outline uppercase tracking-wider mb-1 block">
                  Tasa base (MXN/USD)
                </label>
                <input
                  type="number"
                  value={form.base_rate}
                  onChange={(e) => set("base_rate", e.target.value)}
                  placeholder="17.50"
                  step="any"
                  min="0"
                  className={inputClass("base_rate")}
                />
                <FieldError field="base_rate" />
              </div>
              <div>
                <label className="text-xs font-bold text-outline uppercase tracking-wider mb-1 block">
                  Margen (%)
                </label>
                <input
                  type="number"
                  value={form.spread_percent}
                  onChange={(e) => set("spread_percent", e.target.value)}
                  placeholder="2"
                  step="any"
                  min="0"
                  className={inputClass("spread_percent")}
                />
                <FieldError field="spread_percent" />
              </div>
            </div>
            {preview && (
              <div className="bg-surface-container-low rounded-2xl p-4 flex gap-3">
                <span className="material-symbols-outlined text-primary text-xl flex-shrink-0 mt-0.5">
                  calculate
                </span>
                <p className="text-xs text-on-surface leading-relaxed">
                  {preview}
                </p>
              </div>
            )}
            <NavButtons />
          </div>
        );
      }

      // Step 4 — Limits
      case 4:
        return (
          <div className="flex flex-col gap-4">
            <StepIndicator />
            <h2 className="font-headline font-extrabold text-xl text-on-surface">
              Límites de operación
            </h2>
            <p className="text-sm text-outline leading-relaxed">
              Define el rango de montos que puedes atender en cada operación.
              Esto ayuda a los usuarios a saber si puedes cubrir su necesidad.
            </p>
            <div>
              <label className="text-xs font-bold text-outline uppercase tracking-wider mb-1 block">
                Monto mínimo (MXN)
              </label>
              <input
                type="number"
                value={form.min_amount}
                onChange={(e) => set("min_amount", e.target.value)}
                placeholder="100"
                step="any"
                min="1"
                className={inputClass("min_amount")}
              />
              <FieldError field="min_amount" />
            </div>
            <div>
              <label className="text-xs font-bold text-outline uppercase tracking-wider mb-1 block">
                Monto máximo (MXN)
              </label>
              <input
                type="number"
                value={form.max_amount}
                onChange={(e) => set("max_amount", e.target.value)}
                placeholder="5000"
                step="any"
                className={inputClass("max_amount")}
              />
              <FieldError field="max_amount" />
            </div>
            {submitError && (
              <div className="bg-error/10 border border-error/30 rounded-xl p-4 flex gap-3">
                <span className="material-symbols-outlined text-error text-xl flex-shrink-0">
                  error
                </span>
                <p className="text-sm text-error leading-relaxed">
                  {submitError}
                </p>
              </div>
            )}
            <NavButtons
              nextLabel={loading ? "Enviando…" : "Enviar solicitud"}
            />
          </div>
        );

      // Step 5 — Confirmation
      case 5:
        return (
          <div className="flex flex-col gap-6">
            {registered ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    check_circle
                  </span>
                </div>
                <div>
                  <h2 className="font-headline font-extrabold text-2xl text-on-surface leading-tight mb-3">
                    Solicitud recibida
                  </h2>
                  <p className="text-sm text-outline leading-relaxed mb-4">
                    Revisaremos tu registro y te notificaremos cuando esté
                    listo. Este proceso puede tomar uno o dos días hábiles.
                  </p>
                  <p className="text-sm text-outline leading-relaxed">
                    No necesitas hacer nada más por ahora. Tu perfil no
                    aparecerá en el mapa hasta que sea aprobado.
                  </p>
                </div>

                {/* Status badge */}
                <div className="bg-surface-container-low rounded-2xl p-4">
                  <p className="text-xs font-bold text-outline uppercase tracking-wider mb-2">
                    Estado de tu solicitud
                  </p>
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        registered.verification_status === "verified"
                          ? "bg-[#1D9E75]"
                          : registered.verification_status === "paused"
                            ? "bg-outline"
                            : "bg-primary animate-pulse"
                      }`}
                    />
                    <span className="text-sm font-bold text-on-surface">
                      {STATUS_LABEL[registered.verification_status]}
                    </span>
                  </div>
                  {registered.verification_status === "pending" && (
                    <p className="text-xs text-outline mt-2 leading-relaxed">
                      Tu solicitud está siendo revisada. No necesitas hacer nada
                      más por ahora.
                    </p>
                  )}
                </div>

                {onComplete && (
                  <button
                    onClick={onComplete}
                    className="w-full h-[52px] border border-outline/30 rounded-xl text-sm font-bold text-on-surface bg-white active:scale-95 transition-all"
                  >
                    Volver al inicio
                  </button>
                )}
              </>
            ) : (
              /* Error state — submission failed, keep form intact */
              <>
                <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-error text-3xl">
                    error
                  </span>
                </div>
                <div>
                  <h2 className="font-headline font-extrabold text-2xl text-on-surface leading-tight mb-3">
                    Algo salió mal
                  </h2>
                  {submitError && (
                    <p className="text-sm text-outline leading-relaxed">
                      {submitError}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setCurrentStep(4);
                    setSubmitError(null);
                  }}
                  className="w-full h-[52px] bg-primary text-white rounded-xl text-sm font-bold active:scale-95 transition-all"
                >
                  Intentar de nuevo
                </button>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 py-4 backdrop-blur-md bg-white/90">
        {currentStep > 0 && currentStep < 5 ? (
          <button
            onClick={back}
            className="mr-3 p-1 rounded-full hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface">
              arrow_back
            </span>
          </button>
        ) : (
          <div className="w-8 mr-3" />
        )}
        <span className="font-headline font-bold text-base text-on-surface">
          {currentStep === 0
            ? "Registro de comerciante"
            : currentStep === 5
              ? "Confirmación"
              : "Registro de comerciante"}
        </span>
      </header>

      <main className="flex-1 mt-20 px-6 pb-12">{renderStep()}</main>
    </div>
  );
}
