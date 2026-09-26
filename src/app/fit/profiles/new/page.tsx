"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Gender } from "@/domain/bodyTrackingTypes";
import {
  ProfileService,
  ProfileValidationErrors,
  validateProfileInput,
} from "@/services/profileService";

export default function NewProfilePage() {
  const router = useRouter();

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [height, setHeight] = useState<string>("");
  const [gender, setGender] = useState<Gender>("male");

  // Validation State
  const [errors, setErrors] = useState<ProfileValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live avatar initials
  const initials =
    `${firstName.trim() ? firstName.trim()[0].toUpperCase() : ""}${
      lastName.trim() ? lastName.trim()[0].toUpperCase() : ""
    }` || "👤";

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const result = validateProfileInput({
      firstName,
      lastName,
      height,
      gender,
    });
    setErrors(result.errors);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate all fields
    const validation = validateProfileInput({
      firstName,
      lastName,
      height,
      gender,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      setTouched({
        firstName: true,
        lastName: true,
        height: true,
        gender: true,
      });
      setIsSubmitting(false);
      return;
    }

    // Create profile via Service
    const result = ProfileService.create({
      firstName,
      lastName,
      height,
      gender,
    });

    if (result.errors) {
      setErrors(result.errors);
      setIsSubmitting(false);
      return;
    }

    // Automatically navigate to dashboard
    router.push("/fit/dashboard");
  };

  return (
    <div className="relative min-h-[75vh] flex flex-col items-center justify-center py-6 px-4">
      {/* Background Ambience */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-[480px] h-80 sm:h-[480px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-xl space-y-6">
        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/fit"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground hover:bg-surface-raised transition group cursor-pointer"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            <span>Profil Seçimine Dön</span>
          </Link>

          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            Adım 1: Profil Oluştur
          </span>
        </div>

        {/* Card Container */}
        <div className="rounded-3xl border border-border/80 bg-surface/90 backdrop-blur-md p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Header & Live Avatar Preview */}
          <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-border/70 text-center sm:text-left">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-slate-800 text-white font-black text-2xl shadow-md ring-4 ring-emerald-500/20 transition-all">
              {initials}
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface border border-border text-xs shadow-xs">
                {gender === "male" ? "👨" : "👩"}
              </span>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Yeni Profil Oluştur
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-muted">
                {firstName.trim() || lastName.trim()
                  ? `${firstName.trim()} ${lastName.trim()} için ölçüm takibi başlatılıyor`
                  : "Kişisel ölçüm ve yağ oranı takibi için bilgilerinizi girin."}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* First Name & Last Name Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="firstName"
                  className="block text-xs font-bold text-foreground"
                >
                  İsim <span className="text-emerald-500">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (errors.firstName) {
                      setErrors((prev) => ({ ...prev, firstName: undefined }));
                    }
                  }}
                  onBlur={() => handleBlur("firstName")}
                  placeholder="Örn: Mert"
                  className={`w-full min-h-11 rounded-xl border bg-background/80 px-3.5 py-2 text-sm text-foreground outline-none transition-all placeholder:text-muted/60 ${
                    touched.firstName && errors.firstName
                      ? "border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-border hover:border-emerald-500/40 focus:border-emerald-500 focus:bg-background focus:ring-2 focus:ring-emerald-500/25"
                  }`}
                />
                {touched.firstName && errors.firstName && (
                  <p className="text-[11px] font-medium text-rose-500 animate-in fade-in duration-150">
                    {errors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="lastName"
                  className="block text-xs font-bold text-foreground"
                >
                  Soyisim <span className="text-emerald-500">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (errors.lastName) {
                      setErrors((prev) => ({ ...prev, lastName: undefined }));
                    }
                  }}
                  onBlur={() => handleBlur("lastName")}
                  placeholder="Örn: Yılmaz"
                  className={`w-full min-h-11 rounded-xl border bg-background/80 px-3.5 py-2 text-sm text-foreground outline-none transition-all placeholder:text-muted/60 ${
                    touched.lastName && errors.lastName
                      ? "border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-border hover:border-emerald-500/40 focus:border-emerald-500 focus:bg-background focus:ring-2 focus:ring-emerald-500/25"
                  }`}
                />
                {touched.lastName && errors.lastName && (
                  <p className="text-[11px] font-medium text-rose-500 animate-in fade-in duration-150">
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Height & Gender Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Height Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="height"
                    className="block text-xs font-bold text-foreground"
                  >
                    Boy (cm) <span className="text-emerald-500">*</span>
                  </label>
                  <span className="text-[10px] text-muted font-medium">
                    80 - 250 cm
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="height"
                    type="number"
                    required
                    min="80"
                    max="250"
                    step="0.5"
                    value={height}
                    onChange={(e) => {
                      setHeight(e.target.value);
                      if (errors.height) {
                        setErrors((prev) => ({ ...prev, height: undefined }));
                      }
                    }}
                    onBlur={() => handleBlur("height")}
                    placeholder="180"
                    className={`w-full min-h-11 rounded-xl border bg-background/80 px-3.5 py-2 pr-12 text-sm text-foreground outline-none transition-all placeholder:text-muted/60 ${
                      touched.height && errors.height
                        ? "border-rose-500/80 bg-rose-500/5 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                        : "border-border hover:border-emerald-500/40 focus:border-emerald-500 focus:bg-background focus:ring-2 focus:ring-emerald-500/25"
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted pointer-events-none">
                    cm
                  </span>
                </div>
                {touched.height && errors.height && (
                  <p className="text-[11px] font-medium text-rose-500 animate-in fade-in duration-150">
                    {errors.height}
                  </p>
                )}
              </div>

              {/* Gender Segmented Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Cinsiyet <span className="text-emerald-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 h-11">
                  <button
                    type="button"
                    onClick={() => setGender("male")}
                    className={`flex items-center justify-center gap-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      gender === "male"
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/20 shadow-xs"
                        : "border-border bg-background/60 text-muted hover:border-border/80 hover:text-foreground hover:bg-surface-raised"
                    }`}
                  >
                    <span>👨</span>
                    <span>Erkek</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGender("female")}
                    className={`flex items-center justify-center gap-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      gender === "female"
                        ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/20 shadow-xs"
                        : "border-border bg-background/60 text-muted hover:border-border/80 hover:text-foreground hover:bg-surface-raised"
                    }`}
                  >
                    <span>👩</span>
                    <span>Kadın</span>
                  </button>
                </div>
                {touched.gender && errors.gender && (
                  <p className="text-[11px] font-medium text-rose-500 animate-in fade-in duration-150">
                    {errors.gender}
                  </p>
                )}
              </div>
            </div>

            {/* Informational Callout */}
            <div className="rounded-2xl bg-surface-raised/70 border border-border/60 p-3.5 text-xs text-muted flex items-start gap-2.5">
              <span className="text-base text-emerald-600 dark:text-emerald-400 mt-0.5">
                💡
              </span>
              <p className="leading-relaxed">
                Boy ve cinsiyet bilgisi, <strong>U.S. Navy Vücut Yağ Oranı</strong> ve <strong>Vücut Kitle İndeksi (BMI)</strong> algoritmalarında bilimsel hesaplama için kullanılır.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border/70">
              <Link
                href="/fit"
                className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface px-5 py-2 text-sm font-medium text-foreground hover:bg-surface-raised transition text-center cursor-pointer"
              >
                İptal
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-7 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500 hover:shadow-lg hover:shadow-emerald-600/30 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                <span>Profili Kaydet & Başla</span>
                <span>→</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
