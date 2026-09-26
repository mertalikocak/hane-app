"use client";

import { useState, useEffect, useMemo } from "react";
import { Profile, FullMeasurementRecord } from "@/domain/bodyTrackingTypes";
import {
  calculateBodyFat,
  calculateBMI,
  getBMICategory,
  getBodyFatCategory,
} from "@/domain/bodyCalculations";
import {
  MeasurementService,
  MeasurementValidationErrors,
} from "@/services/measurementService";

interface MeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  initialRecord?: FullMeasurementRecord | null;
  onSuccess?: () => void;
}

export function MeasurementModal({
  isOpen,
  onClose,
  profile,
  initialRecord,
  onSuccess,
}: MeasurementModalProps) {
  const isEditMode = !!initialRecord;

  // Core Form State
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [weight, setWeight] = useState<string>("");
  const [neck, setNeck] = useState<string>("");
  const [waist, setWaist] = useState<string>("");
  const [hip, setHip] = useState<string>("");

  // Muscle Measurements Accordion State
  const [isMuscleOpen, setIsMuscleOpen] = useState(false);
  const [shoulder, setShoulder] = useState<string>("");
  const [chest, setChest] = useState<string>("");
  const [back, setBack] = useState<string>("");
  const [rightArm, setRightArm] = useState<string>("");
  const [leftArm, setLeftArm] = useState<string>("");
  const [rightThigh, setRightThigh] = useState<string>("");
  const [leftThigh, setLeftThigh] = useState<string>("");
  const [rightCalf, setRightCalf] = useState<string>("");
  const [leftCalf, setLeftCalf] = useState<string>("");

  // Validation State
  const [errors, setErrors] = useState<MeasurementValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close on ESC key & lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Pre-fill form on open or when initialRecord changes
  useEffect(() => {
    if (isOpen) {
      if (initialRecord) {
        const m = initialRecord.measurement;
        const mus = initialRecord.muscle;

        setDate(m.date || new Date().toISOString().split("T")[0]);
        setWeight(m.weight !== undefined && m.weight !== null ? String(m.weight) : "");
        setNeck(m.neck ? String(m.neck) : "");
        setWaist(m.waist ? String(m.waist) : "");
        setHip(m.hip ? String(m.hip) : "");

        if (mus) {
          const hasAnyMuscle =
            mus.shoulder ||
            mus.chest ||
            mus.back ||
            mus.rightArm ||
            mus.leftArm ||
            mus.rightThigh ||
            mus.leftThigh ||
            mus.rightCalf ||
            mus.leftCalf;

          setIsMuscleOpen(!!hasAnyMuscle);
          setShoulder(mus.shoulder ? String(mus.shoulder) : "");
          setChest(mus.chest ? String(mus.chest) : "");
          setBack(mus.back ? String(mus.back) : "");
          setRightArm(mus.rightArm ? String(mus.rightArm) : "");
          setLeftArm(mus.leftArm ? String(mus.leftArm) : "");
          setRightThigh(mus.rightThigh ? String(mus.rightThigh) : "");
          setLeftThigh(mus.leftThigh ? String(mus.leftThigh) : "");
          setRightCalf(mus.rightCalf ? String(mus.rightCalf) : "");
          setLeftCalf(mus.leftCalf ? String(mus.leftCalf) : "");
        } else {
          setIsMuscleOpen(false);
          setShoulder("");
          setChest("");
          setBack("");
          setRightArm("");
          setLeftArm("");
          setRightThigh("");
          setLeftThigh("");
          setRightCalf("");
          setLeftCalf("");
        }
      } else {
        setDate(new Date().toISOString().split("T")[0]);
        setWeight("");
        setNeck("");
        setWaist("");
        setHip("");
        setIsMuscleOpen(false);
        setShoulder("");
        setChest("");
        setBack("");
        setRightArm("");
        setLeftArm("");
        setRightThigh("");
        setLeftThigh("");
        setRightCalf("");
        setLeftCalf("");
      }

      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    }
  }, [isOpen, initialRecord]);

  // Numeric parsers for live preview (handles decimal dot or comma)
  const parseDecimalInput = (val: string): number | null => {
    if (!val || val.trim() === "") return null;
    const clean = val.trim().replace(",", ".");
    const num = parseFloat(clean);
    return isNaN(num) || !isFinite(num) ? null : num;
  };

  const parsedWeight = parseDecimalInput(weight);
  const parsedNeck = parseDecimalInput(neck);
  const parsedWaist = parseDecimalInput(waist);
  const parsedHip = parseDecimalInput(hip);

  // Live Body Fat Calculation via calculateBodyFat utility (exact same logic used on save)
  const liveBodyFat = useMemo(() => {
    return calculateBodyFat({
      gender: profile.gender,
      height: profile.height,
      neck: parsedNeck,
      waist: parsedWaist,
      hip: parsedHip,
    });
  }, [profile.gender, profile.height, parsedNeck, parsedWaist, parsedHip]);

  // Live BMI Calculation
  const liveBMI = useMemo(() => {
    if (!parsedWeight || parsedWeight <= 0) return null;
    return calculateBMI(parsedWeight, profile.height);
  }, [parsedWeight, profile.height]);

  const bmiCategory = liveBMI ? getBMICategory(liveBMI) : null;
  const bodyFatCategory =
    liveBodyFat !== null ? getBodyFatCategory(profile.gender, liveBodyFat) : null;

  // Feedback helper text when bodyFat cannot yet be calculated
  const missingMeasurementText = useMemo(() => {
    if (liveBodyFat !== null) return null;

    if (profile.gender === "male") {
      if (!parsedNeck && !parsedWaist) {
        return "Yağ oranını hesaplamak için boyun ve bel ölçümlerini tamamla";
      }
      if (!parsedNeck) {
        return "Yağ oranını hesaplamak için boyun ölçümünü gir";
      }
      if (!parsedWaist) {
        return "Yağ oranını hesaplamak için bel ölçümünü gir";
      }
      if (parsedWaist <= (parsedNeck || 0)) {
        return "Bel ölçüsü boyun ölçüsünden büyük olmalıdır";
      }
    } else {
      // female
      const missing: string[] = [];
      if (!parsedNeck) missing.push("boyun");
      if (!parsedWaist) missing.push("bel");
      if (!parsedHip) missing.push("kalça");

      if (missing.length > 0) {
        return `Yağ oranını hesaplamak için ${missing.join(", ")} ölçümlerini tamamla`;
      }
      if ((parsedWaist || 0) + (parsedHip || 0) <= (parsedNeck || 0)) {
        return "Bel ve kalça toplamı boyun ölçüsünden büyük olmalıdır";
      }
    }

    return "Yağ oranını hesaplamak için ölçümleri tamamla";
  }, [liveBodyFat, profile.gender, parsedNeck, parsedWaist, parsedHip]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formattedWeight = weight.trim().replace(",", ".");
    const formattedNeck = neck.trim().replace(",", ".");
    const formattedWaist = waist.trim().replace(",", ".");
    const formattedHip = hip.trim().replace(",", ".");

    const muscleInput = {
      shoulder: shoulder.trim() ? shoulder.trim().replace(",", ".") : null,
      chest: chest.trim() ? chest.trim().replace(",", ".") : null,
      back: back.trim() ? back.trim().replace(",", ".") : null,
      rightArm: rightArm.trim() ? rightArm.trim().replace(",", ".") : null,
      leftArm: leftArm.trim() ? leftArm.trim().replace(",", ".") : null,
      rightThigh: rightThigh.trim() ? rightThigh.trim().replace(",", ".") : null,
      leftThigh: leftThigh.trim() ? leftThigh.trim().replace(",", ".") : null,
      rightCalf: rightCalf.trim() ? rightCalf.trim().replace(",", ".") : null,
      leftCalf: leftCalf.trim() ? leftCalf.trim().replace(",", ".") : null,
    };

    const result = MeasurementService.create(
      {
        id: initialRecord?.measurement.id,
        profileId: profile.id,
        date,
        weight: formattedWeight,
        neck: formattedNeck || null,
        waist: formattedWaist || null,
        hip: profile.gender === "female" ? formattedHip || null : null,
      },
      profile,
      muscleInput
    );

    if (result.errors) {
      setErrors(result.errors);
      setTouched({
        date: true,
        weight: true,
        neck: true,
        waist: true,
        hip: true,
      });
      setIsSubmitting(false);
      return;
    }

    onClose();
    if (onSuccess) {
      onSuccess();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-border/80 bg-surface shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border/70 bg-surface/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xl font-bold shadow-sm">
              ⚖️
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-black tracking-tight text-foreground">
                {isEditMode ? "Ölçümü Düzenle" : "Yeni Ölçüm Ekle"}
              </h2>
              <p className="text-xs text-muted">
                {profile.firstName} {profile.lastName} ({profile.height} cm • {profile.gender === "male" ? "Erkek" : "Kadın"})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-surface-raised text-muted hover:text-foreground hover:border-border transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Form Body */}
        <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Section 1: Mandatory Fields (Tarih & Kilo) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Zorunlu Bilgiler
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                * Sadece Tarih + Kilo yeterlidir
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Tarih */}
              <div className="space-y-1.5">
                <label
                  htmlFor="meas-date"
                  className="block text-xs font-bold text-foreground"
                >
                  Ölçüm Tarihi <span className="text-emerald-500">*</span>
                </label>
                <input
                  id="meas-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (errors.date) {
                      setErrors((prev) => ({ ...prev, date: undefined }));
                    }
                  }}
                  className={`field font-medium ${
                    touched.date && errors.date ? "border-rose-500/80 bg-rose-500/5" : ""
                  }`}
                />
                {touched.date && errors.date && (
                  <p className="text-[11px] font-semibold text-rose-500 animate-in fade-in duration-150">
                    {errors.date}
                  </p>
                )}
              </div>

              {/* Kilo */}
              <div className="space-y-1.5">
                <label
                  htmlFor="meas-weight"
                  className="block text-xs font-bold text-foreground"
                >
                  Kilo <span className="text-emerald-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="meas-weight"
                    type="text"
                    inputMode="decimal"
                    required
                    value={weight}
                    onChange={(e) => {
                      setWeight(e.target.value);
                      if (errors.weight) {
                        setErrors((prev) => ({ ...prev, weight: undefined }));
                      }
                    }}
                    placeholder="Örn: 99.2"
                    className={`field pr-12 font-bold ${
                      touched.weight && errors.weight ? "border-rose-500/80 bg-rose-500/5" : ""
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted pointer-events-none">
                    kg
                  </span>
                </div>
                {touched.weight && errors.weight && (
                  <p className="text-[11px] font-semibold text-rose-500 animate-in fade-in duration-150">
                    {errors.weight}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Optional Body Measurements (Boyun / Bel / Kalça) */}
          <div className="space-y-3.5 pt-2 border-t border-border/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Çevre Ölçüleri (Opsiyonel)
              </span>
              <span className="text-[11px] text-muted">
                Yağ oranı hesabı için önerilir
              </span>
            </div>

            <div
              className={`grid gap-3.5 ${
                profile.gender === "female" ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
              }`}
            >
              {/* Boyun */}
              <div className="space-y-1.5">
                <label
                  htmlFor="meas-neck"
                  className="block text-xs font-bold text-foreground"
                >
                  Boyun <span className="text-muted font-normal">(opsiyonel)</span>
                </label>
                <div className="relative">
                  <input
                    id="meas-neck"
                    type="text"
                    inputMode="decimal"
                    value={neck}
                    onChange={(e) => {
                      setNeck(e.target.value);
                      if (errors.neck) {
                        setErrors((prev) => ({ ...prev, neck: undefined }));
                      }
                    }}
                    placeholder="Örn: 42"
                    className={`field pr-12 font-semibold ${
                      touched.neck && errors.neck ? "border-rose-500/80 bg-rose-500/5" : ""
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted pointer-events-none">
                    cm
                  </span>
                </div>
                {touched.neck && errors.neck && (
                  <p className="text-[11px] font-semibold text-rose-500 animate-in fade-in duration-150">
                    {errors.neck}
                  </p>
                )}
              </div>

              {/* Bel */}
              <div className="space-y-1.5">
                <label
                  htmlFor="meas-waist"
                  className="block text-xs font-bold text-foreground"
                >
                  Bel <span className="text-muted font-normal">(opsiyonel)</span>
                </label>
                <div className="relative">
                  <input
                    id="meas-waist"
                    type="text"
                    inputMode="decimal"
                    value={waist}
                    onChange={(e) => {
                      setWaist(e.target.value);
                      if (errors.waist) {
                        setErrors((prev) => ({ ...prev, waist: undefined }));
                      }
                    }}
                    placeholder="Örn: 105"
                    className={`field pr-12 font-semibold ${
                      touched.waist && errors.waist ? "border-rose-500/80 bg-rose-500/5" : ""
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted pointer-events-none">
                    cm
                  </span>
                </div>
                {touched.waist && errors.waist && (
                  <p className="text-[11px] font-semibold text-rose-500 animate-in fade-in duration-150">
                    {errors.waist}
                  </p>
                )}
              </div>

              {/* Kalça (Female Only) */}
              {profile.gender === "female" && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="meas-hip"
                    className="block text-xs font-bold text-foreground"
                  >
                    Kalça <span className="text-muted font-normal">(opsiyonel)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="meas-hip"
                      type="text"
                      inputMode="decimal"
                      value={hip}
                      onChange={(e) => {
                        setHip(e.target.value);
                        if (errors.hip) {
                          setErrors((prev) => ({ ...prev, hip: undefined }));
                        }
                      }}
                      placeholder="Örn: 100"
                      className={`field pr-12 font-semibold ${
                        touched.hip && errors.hip ? "border-rose-500/80 bg-rose-500/5" : ""
                      }`}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted pointer-events-none">
                      cm
                    </span>
                  </div>
                  {touched.hip && errors.hip && (
                    <p className="text-[11px] font-semibold text-rose-500 animate-in fade-in duration-150">
                      {errors.hip}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: DISTINCT LIVE BODY FAT PREVIEW CARD */}
          <div
            className={`rounded-2xl p-4 transition-all duration-200 ${
              liveBodyFat !== null
                ? "bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-surface-raised border border-emerald-500/30 ring-1 ring-emerald-500/15 shadow-sm"
                : "bg-surface-raised/70 border border-border/70"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Body Fat Preview Area */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-base font-black transition-all ${
                    liveBodyFat !== null
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "bg-surface border border-border text-muted"
                  }`}
                >
                  🎯
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                    Tahmini Yağ Oranı
                  </span>

                  {liveBodyFat !== null ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-foreground tracking-tight">
                        {liveBodyFat}%
                      </span>
                      {bodyFatCategory && (
                        <span
                          className={`rounded-lg px-2 py-0.5 text-xs font-bold bg-surface border border-border/60 ${bodyFatCategory.color}`}
                        >
                          {bodyFatCategory.label}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted font-medium">
                      {missingMeasurementText}
                    </p>
                  )}
                </div>
              </div>

              {/* BMI Pill */}
              {liveBMI !== null && (
                <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-border/60 pt-2 sm:pt-0 sm:pl-3.5 self-start sm:self-center">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-muted font-bold block uppercase">
                      BMI
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-foreground">
                        {liveBMI}
                      </span>
                      {bmiCategory && (
                        <span className={`text-[10px] font-bold ${bmiCategory.color}`}>
                          ({bmiCategory.label})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {liveBodyFat !== null && (
              <div className="mt-2.5 pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px] text-muted">
                <span>U.S. Navy Circumference Metodu</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Kaydedilmeye Hazır ✓
                </span>
              </div>
            )}
          </div>

          {/* Section 4: ACCORDION SECTION FOR MUSCLE MEASUREMENTS */}
          <div className="pt-1 border-t border-border/70">
            <button
              type="button"
              onClick={() => setIsMuscleOpen(!isMuscleOpen)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-surface-raised/60 hover:bg-surface-raised border border-border/60 transition cursor-pointer select-none group"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  💪
                </span>
                <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Kas Ölçümleri
                </span>
                <span className="text-[10px] text-muted font-normal">
                  (Opsiyonel)
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-muted group-hover:text-foreground transition-colors">
                <span className="text-xs font-medium hidden sm:inline">
                  {isMuscleOpen ? "Gizle" : "Genişlet"}
                </span>
                <span
                  className={`text-sm font-bold transition-transform duration-200 inline-block ${
                    isMuscleOpen ? "rotate-180" : "rotate-0"
                  }`}
                >
                  ⌄
                </span>
              </div>
            </button>

            {/* Accordion Collapsible Content */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isMuscleOpen ? "max-h-[600px] opacity-100 mt-3.5" : "max-h-0 opacity-0"
              }`}
            >
              <div className="rounded-2xl border border-border/70 bg-surface-raised/40 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    Bölgesel Kas Çevreleri (cm)
                  </span>
                  <span className="text-[10px] text-muted">
                    Ondalıklı değer girilebilir (Örn: 38.5)
                  </span>
                </div>

                {/* Upper Body (Omuz, Göğüs, Sırt) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-muted">
                      Omuz (cm)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={shoulder}
                        onChange={(e) => setShoulder(e.target.value)}
                        placeholder="Örn: 118"
                        className="field pr-10 text-xs font-semibold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted pointer-events-none">
                        cm
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-muted">
                      Göğüs (cm)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={chest}
                        onChange={(e) => setChest(e.target.value)}
                        placeholder="Örn: 104"
                        className="field pr-10 text-xs font-semibold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted pointer-events-none">
                        cm
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-muted">
                      Sırt (cm)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={back}
                        onChange={(e) => setBack(e.target.value)}
                        placeholder="Örn: 95"
                        className="field pr-10 text-xs font-semibold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted pointer-events-none">
                        cm
                      </span>
                    </div>
                  </div>
                </div>

                {/* Arms (Sağ Kol, Sol Kol) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-muted">
                      Sağ Kol (cm)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={rightArm}
                        onChange={(e) => setRightArm(e.target.value)}
                        placeholder="Örn: 38.5"
                        className="field pr-10 text-xs font-semibold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted pointer-events-none">
                        cm
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-muted">
                      Sol Kol (cm)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={leftArm}
                        onChange={(e) => setLeftArm(e.target.value)}
                        placeholder="Örn: 38"
                        className="field pr-10 text-xs font-semibold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted pointer-events-none">
                        cm
                      </span>
                    </div>
                  </div>
                </div>

                {/* Thighs (Sağ Bacak, Sol Bacak) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-muted">
                      Sağ Bacak (cm)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={rightThigh}
                        onChange={(e) => setRightThigh(e.target.value)}
                        placeholder="Örn: 58"
                        className="field pr-10 text-xs font-semibold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted pointer-events-none">
                        cm
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-muted">
                      Sol Bacak (cm)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={leftThigh}
                        onChange={(e) => setLeftThigh(e.target.value)}
                        placeholder="Örn: 58"
                        className="field pr-10 text-xs font-semibold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted pointer-events-none">
                        cm
                      </span>
                    </div>
                  </div>
                </div>

                {/* Calves (Sağ Baldır, Sol Baldır) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-muted">
                      Sağ Baldır (cm)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={rightCalf}
                        onChange={(e) => setRightCalf(e.target.value)}
                        placeholder="Örn: 39"
                        className="field pr-10 text-xs font-semibold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted pointer-events-none">
                        cm
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-muted">
                      Sol Baldır (cm)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={leftCalf}
                        onChange={(e) => setLeftCalf(e.target.value)}
                        placeholder="Örn: 39"
                        className="field pr-10 text-xs font-semibold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted pointer-events-none">
                        cm
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer / Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 p-4 sm:p-5 border-t border-border/70 bg-surface/90 backdrop-blur-md shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="secondary-button min-w-24 cursor-pointer"
          >
            İptal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="primary-button bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 min-w-36 font-bold shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
          >
            {isEditMode ? "Değişiklikleri Kaydet" : "Ölçümü Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
