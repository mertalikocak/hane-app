"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getProfiles,
  getActiveProfileId,
  saveMeasurement,
} from "@/storage/bodyStorage";
import { Profile } from "@/domain/bodyTrackingTypes";
import {
  calculateBodyFat,
  calculateBMI,
  getBMICategory,
  getBodyFatCategory,
} from "@/domain/bodyCalculations";

export default function NewMeasurementPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState<string>("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Core Measurements
  const [weight, setWeight] = useState<number | "">("");
  const [neck, setNeck] = useState<number | "">("");
  const [waist, setWaist] = useState<number | "">("");
  const [hip, setHip] = useState<number | "">("");
  const [manualBodyFat, setManualBodyFat] = useState<number | "">("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Muscle Measurements (Optional)
  const [showMuscle, setShowMuscle] = useState(false);
  const [shoulder, setShoulder] = useState<number | "">("");
  const [chest, setChest] = useState<number | "">("");
  const [back, setBack] = useState<number | "">("");
  const [rightArm, setRightArm] = useState<number | "">("");
  const [leftArm, setLeftArm] = useState<number | "">("");
  const [rightThigh, setRightThigh] = useState<number | "">("");
  const [leftThigh, setLeftThigh] = useState<number | "">("");
  const [rightCalf, setRightCalf] = useState<number | "">("");
  const [leftCalf, setLeftCalf] = useState<number | "">("");

  useEffect(() => {
    const list = getProfiles();
    setProfiles(list);
    const active = getActiveProfileId();
    if (active && list.some((p) => p.id === active)) {
      setProfileId(active);
    } else if (list.length > 0) {
      setProfileId(list[0].id);
    }
  }, []);

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === profileId),
    [profiles, profileId]
  );

  // Live Calculations
  const calculatedBodyFat = useMemo(() => {
    if (!selectedProfile) return null;
    const neckVal = typeof neck === "number" ? neck : null;
    const waistVal = typeof waist === "number" ? waist : null;
    const hipVal = typeof hip === "number" ? hip : null;

    return calculateBodyFat({
      gender: selectedProfile.gender,
      height: selectedProfile.height,
      neck: neckVal,
      waist: waistVal,
      hip: hipVal,
    });
  }, [selectedProfile, neck, waist, hip]);

  const calculatedBMI = useMemo(() => {
    if (!selectedProfile || typeof weight !== "number") return null;
    return calculateBMI(weight, selectedProfile.height);
  }, [selectedProfile, weight]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId || typeof weight !== "number" || typeof neck !== "number" || typeof waist !== "number") {
      setErrorMsg("Lütfen profil, kilo, boyun ve bel alanlarını eksiksiz doldurun.");
      return;
    }

    const finalBodyFat =
      typeof manualBodyFat === "number" && manualBodyFat > 0
        ? manualBodyFat
        : calculatedBodyFat ?? undefined;

    const muscleData = showMuscle
      ? {
          shoulder: typeof shoulder === "number" ? shoulder : undefined,
          chest: typeof chest === "number" ? chest : undefined,
          back: typeof back === "number" ? back : undefined,
          rightArm: typeof rightArm === "number" ? rightArm : undefined,
          leftArm: typeof leftArm === "number" ? leftArm : undefined,
          rightThigh: typeof rightThigh === "number" ? rightThigh : undefined,
          leftThigh: typeof leftThigh === "number" ? leftThigh : undefined,
          rightCalf: typeof rightCalf === "number" ? rightCalf : undefined,
          leftCalf: typeof leftCalf === "number" ? leftCalf : undefined,
        }
      : undefined;

    saveMeasurement(
      {
        profileId,
        date,
        weight,
        neck,
        waist,
        hip: typeof hip === "number" ? hip : undefined,
        bodyFat: finalBodyFat,
      },
      muscleData
    );

    window.dispatchEvent(new Event("fit_measurements_updated"));
    router.push("/fit/measurements");
  };

  if (profiles.length === 0) {
    return (
      <div className="ds-card p-8 text-center max-w-md mx-auto space-y-3">
        <h3 className="text-lg font-bold text-foreground">Profil Bulunamadı</h3>
        <p className="text-xs text-muted">
          Ölçüm kaydetmeden önce lütfen bir profil oluşturun.
        </p>
        <Link
          href="/fit/profiles"
          className="primary-button px-4 py-2 text-sm font-semibold"
        >
          Profil Oluştur
        </Link>
      </div>
    );
  }

  const bmiCat = calculatedBMI ? getBMICategory(calculatedBMI) : null;
  const bfCat =
    calculatedBodyFat && selectedProfile
      ? getBodyFatCategory(selectedProfile.gender, calculatedBodyFat)
      : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Yeni Vücut Ölçümü Ekle
        </h2>
        <p className="text-xs sm:text-sm text-muted">
          Ölçümlerinizi girin; tahmini yağ oranınız ve BMI değeriniz otomatik hesaplansın.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-danger-soft border border-danger/30 text-danger text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile & Date Card */}
        <div className="ds-card p-5 sm:p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            1. Profil ve Tarih
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Kişi / Profil *
              </label>
              <select
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                className="field"
                required
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} (Boy: {p.height} cm • {p.gender === "male" ? "Erkek" : "Kadın"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Ölçüm Tarihi *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="field"
              />
            </div>
          </div>
        </div>

        {/* Core Measurements Card */}
        <div className="ds-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              2. Temel Vücut Ölçüleri (Zorunlu)
            </h3>
            <span className="text-xs text-primary font-semibold">
              U.S. Navy Yağ Hesabı İçin
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Kilo (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                min="30"
                max="300"
                value={weight}
                onChange={(e) =>
                  setWeight(e.target.value ? Number(e.target.value) : "")
                }
                placeholder="Örn: 78.5"
                className="field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Boyun (cm) *
              </label>
              <input
                type="number"
                step="0.5"
                required
                min="20"
                max="70"
                value={neck}
                onChange={(e) =>
                  setNeck(e.target.value ? Number(e.target.value) : "")
                }
                placeholder="Örn: 38"
                className="field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Bel (cm) *
              </label>
              <input
                type="number"
                step="0.5"
                required
                min="40"
                max="200"
                value={waist}
                onChange={(e) =>
                  setWaist(e.target.value ? Number(e.target.value) : "")
                }
                placeholder="Örn: 84"
                className="field"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Kalça (cm) {selectedProfile?.gender === "female" ? "*" : "(Opsiyonel)"}
              </label>
              <input
                type="number"
                step="0.5"
                required={selectedProfile?.gender === "female"}
                min="40"
                max="200"
                value={hip}
                onChange={(e) =>
                  setHip(e.target.value ? Number(e.target.value) : "")
                }
                placeholder="Örn: 98"
                className="field"
              />
            </div>
          </div>

          {/* Live Calculation Preview Banner */}
          <div className="rounded-xl bg-surface-lavender border border-border-lavender p-4 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-border-lavender text-lg">
                  ⚡
                </span>
                <div>
                  <span className="text-xs font-bold text-muted block">
                    Tahmini Yağ Oranı
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-foreground tabular-nums">
                      {calculatedBodyFat !== null ? `%${calculatedBodyFat}` : "Ölçüm bekleniyor"}
                    </span>
                    {bfCat && (
                      <span className={`text-xs font-bold ${bfCat.color}`}>
                        ({bfCat.label})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-border-lavender pt-2 sm:pt-0 sm:pl-4">
                <div>
                  <span className="text-xs font-bold text-muted block">
                    Vücut Kitle İndeksi (BMI)
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-foreground tabular-nums">
                      {calculatedBMI !== null ? calculatedBMI : "—"}
                    </span>
                    {bmiCat && (
                      <span className={`text-xs font-bold ${bmiCat.color}`}>
                        ({bmiCat.label})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Muscle Measurements Toggle */}
        <div className="ds-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                3. Kas & Çevre Ölçüleri
              </h3>
              <p className="text-xs text-muted">
                Omuz, göğüs, kol ve bacak ölçülerini kaydetmek ister misiniz?
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowMuscle(!showMuscle)}
              className="secondary-button h-9 px-3 text-xs font-semibold"
            >
              {showMuscle ? "Gizle ▲" : "Ölçüleri Aç ▼"}
            </button>
          </div>

          {showMuscle && (
            <div className="pt-3 border-t border-border space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Omuz (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={shoulder}
                    onChange={(e) =>
                      setShoulder(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="Örn: 115"
                    className="field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Göğüs (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={chest}
                    onChange={(e) =>
                      setChest(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="Örn: 100"
                    className="field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Sırt (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={back}
                    onChange={(e) =>
                      setBack(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="Örn: 92"
                    className="field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Sağ Kol (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={rightArm}
                    onChange={(e) =>
                      setRightArm(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="Örn: 36"
                    className="field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Sol Kol (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={leftArm}
                    onChange={(e) =>
                      setLeftArm(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="Örn: 35.5"
                    className="field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Sağ Bacak (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={rightThigh}
                    onChange={(e) =>
                      setRightThigh(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="Örn: 56"
                    className="field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Sol Bacak (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={leftThigh}
                    onChange={(e) =>
                      setLeftThigh(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="Örn: 56"
                    className="field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Sağ Kalf (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={rightCalf}
                    onChange={(e) =>
                      setRightCalf(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="Örn: 37"
                    className="field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Sol Kalf (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={leftCalf}
                    onChange={(e) =>
                      setLeftCalf(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="Örn: 37"
                    className="field"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/fit/dashboard"
            className="secondary-button"
          >
            Vazgeç
          </Link>
          <button
            type="submit"
            className="primary-button px-6 py-2.5 font-semibold"
          >
            Ölçümü Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}
