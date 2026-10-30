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
import { CloseIcon, ChevronDownIcon } from "@/components/ui/Icons";

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

  const liveBodyFat = useMemo(() => {
    return calculateBodyFat({
      gender: profile.gender,
      height: profile.height,
      neck: parsedNeck,
      waist: parsedWaist,
      hip: parsedHip,
    });
  }, [profile.gender, profile.height, parsedNeck, parsedWaist, parsedHip]);

  const liveBMI = useMemo(() => {
    if (!parsedWeight || parsedWeight <= 0) return null;
    return calculateBMI(parsedWeight, profile.height);
  }, [parsedWeight, profile.height]);

  const bmiCategory = liveBMI ? getBMICategory(liveBMI) : null;
  const bodyFatCategory =
    liveBodyFat !== null ? getBodyFatCategory(profile.gender, liveBodyFat) : null;

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-[2px] p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-surface shadow-lg animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-lavender border border-border-lavender text-lg">
              ⚖️
            </div>
            <div>
              <h2 id="modal-title" className="text-base font-bold tracking-tight text-foreground">
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
            className="icon-button"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Form Body */}
        <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Section 1: Mandatory Fields (Tarih & Kilo) */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Zorunlu Bilgiler
              </span>
              <span className="text-[11px] text-primary font-semibold">
                * Sadece Tarih + Kilo yeterlidir
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label
                  htmlFor="meas-date"
                  className="block text-xs font-bold text-foreground"
                >
                  Ölçüm Tarihi <span className="text-primary">*</span>
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
                    touched.date && errors.date ? "field-error" : ""
                  }`}
                />
                {touched.date && errors.date && (
                  <p className="text-[11px] font-semibold text-danger">
                    {errors.date}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="meas-weight"
                  className="block text-xs font-bold text-foreground"
                >
                  Kilo <span className="text-primary">*</span>
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
                      touched.weight && errors.weight ? "field-error" : ""
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted pointer-events-none">
                    kg
                  </span>
                </div>
                {touched.weight && errors.weight && (
                  <p className="text-[11px] font-semibold text-danger">
                    {errors.weight}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Optional Body Measurements */}
          <div className="space-y-3.5 pt-2 border-t border-border">
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
                      touched.neck && errors.neck ? "field-error" : ""
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted pointer-events-none">
                    cm
                  </span>
                </div>
                {touched.neck && errors.neck && (
                  <p className="text-[11px] font-semibold text-danger">
                    {errors.neck}
                  </p>
                )}
              </div>

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
                      touched.waist && errors.waist ? "field-error" : ""
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted pointer-events-none">
                    cm
                  </span>
                </div>
                {touched.waist && errors.waist && (
                  <p className="text-[11px] font-semibold text-danger">
                    {errors.waist}
                  </p>
                )}
              </div>

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
                        touched.hip && errors.hip ? "field-error" : ""
                      }`}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted pointer-events-none">
                      cm
                    </span>
                  </div>
                  {touched.hip && errors.hip && (
                    <p className="text-[11px] font-semibold text-danger">
                      {errors.hip}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: LIVE BODY FAT PREVIEW CARD */}
          <div
            className={`rounded-xl p-4 transition-all duration-150 ${
              liveBodyFat !== null
                ? "bg-surface-lavender border border-border-lavender"
                : "bg-surface-raised border border-border"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold ${
                    liveBodyFat !== null
                      ? "bg-surface text-primary border border-border-lavender shadow-xs"
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
                      <span className="text-2xl font-bold text-foreground tracking-tight tabular-nums">
                        {liveBodyFat}%
                      </span>
                      {bodyFatCategory && (
                        <span
                          className={`rounded-lg px-2 py-0.5 text-xs font-bold bg-surface border border-border ${bodyFatCategory.color}`}
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

              {liveBMI !== null && (
                <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-border pt-2 sm:pt-0 sm:pl-3.5 self-start sm:self-center">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-muted font-bold block uppercase">
                      BMI
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-foreground tabular-nums">
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
              <div className="mt-2.5 pt-2 border-t border-border-lavender flex items-center justify-between text-[11px] text-muted">
                <span>U.S. Navy Circumference Metodu</span>
                <span className="font-semibold text-primary">
                  Kaydedilmeye Hazır ✓
                </span>
              </div>
            )}
          </div>

          {/* Section 4: ACCORDION SECTION FOR MUSCLE MEASUREMENTS */}
          <div className="pt-1 border-t border-border">
            <button
              type="button"
              onClick={() => setIsMuscleOpen(!isMuscleOpen)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-raised hover:bg-background-subtle border border-border transition cursor-pointer select-none group"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface border border-border text-xs font-bold">
                  💪
                </span>
                <span className="text-xs sm:text-sm font-bold text-foreground">
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
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isMuscleOpen ? "rotate-180" : "rotate-0"
                  }`}
                />
              </div>
            </button>

            <div
              className={`transition-all duration-200 ease-in-out overflow-hidden ${
                isMuscleOpen ? "max-h-[600px] opacity-100 mt-3.5" : "max-h-0 opacity-0"
              }`}
            >
              <div className="rounded-xl border border-border bg-surface-raised/60 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    Bölgesel Kas Çevreleri (cm)
                  </span>
                  <span className="text-[10px] text-muted">
                    Ondalıklı değer girilebilir (Örn: 38.5)
                  </span>
                </div>

                {/* Upper Body */}
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

                {/* Arms */}
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

                {/* Thighs */}
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

                {/* Calves */}
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

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-border bg-surface shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="secondary-button min-w-24"
          >
            İptal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="primary-button min-w-36 font-semibold"
          >
            {isEditMode ? "Değişiklikleri Kaydet" : "Ölçümü Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
