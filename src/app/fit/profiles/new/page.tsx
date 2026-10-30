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
import { ArrowRightIcon } from "@/components/ui/Icons";

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

    router.push("/fit/dashboard");
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-6 px-4">
      <div className="w-full max-w-xl space-y-6">
        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/fit/dashboard"
            className="secondary-button h-9 px-3 text-xs font-semibold"
          >
            <span>←</span>
            <span>Geri Dön</span>
          </Link>

          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-surface-lavender px-3 py-1 rounded-full border border-border-lavender">
            Adım 1: Profil Oluştur
          </span>
        </div>

        {/* Card Container */}
        <div className="ds-card p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          {/* Header & Live Avatar Preview */}
          <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-border text-center sm:text-left">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl shadow-xs">
              {initials}
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface border border-border text-xs shadow-xs">
                {gender === "male" ? "👨" : "👩"}
              </span>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
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
                  İsim <span className="text-primary">*</span>
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
                  className={`field ${
                    touched.firstName && errors.firstName ? "field-error" : ""
                  }`}
                />
                {touched.firstName && errors.firstName && (
                  <p className="text-[11px] font-medium text-danger">
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
                  Soyisim <span className="text-primary">*</span>
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
                  className={`field ${
                    touched.lastName && errors.lastName ? "field-error" : ""
                  }`}
                />
                {touched.lastName && errors.lastName && (
                  <p className="text-[11px] font-medium text-danger">
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
                    Boy (cm) <span className="text-primary">*</span>
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
                    className={`field pr-12 ${
                      touched.height && errors.height ? "field-error" : ""
                    }`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted pointer-events-none">
                    cm
                  </span>
                </div>
                {touched.height && errors.height && (
                  <p className="text-[11px] font-medium text-danger">
                    {errors.height}
                  </p>
                )}
              </div>

              {/* Gender Segmented Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Cinsiyet <span className="text-primary">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 h-11">
                  <button
                    type="button"
                    onClick={() => setGender("male")}
                    className={`flex items-center justify-center gap-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      gender === "male"
                        ? "border-primary bg-surface-lavender text-primary ring-2 ring-primary/15 shadow-xs"
                        : "border-border bg-surface-raised text-muted hover:text-foreground"
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
                        ? "border-primary bg-surface-lavender text-primary ring-2 ring-primary/15 shadow-xs"
                        : "border-border bg-surface-raised text-muted hover:text-foreground"
                    }`}
                  >
                    <span>👩</span>
                    <span>Kadın</span>
                  </button>
                </div>
                {touched.gender && errors.gender && (
                  <p className="text-[11px] font-medium text-danger">
                    {errors.gender}
                  </p>
                )}
              </div>
            </div>

            {/* Informational Callout */}
            <div className="rounded-xl bg-surface-raised border border-border p-3.5 text-xs text-muted flex items-start gap-2.5">
              <span className="text-base mt-0.5">💡</span>
              <p className="leading-relaxed">
                Boy ve cinsiyet bilgisi, <strong>U.S. Navy Vücut Yağ Oranı</strong> ve <strong>Vücut Kitle İndeksi (BMI)</strong> algoritmalarında bilimsel hesaplama için kullanılır.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border">
              <Link
                href="/fit/dashboard"
                className="secondary-button w-full sm:w-auto px-5"
              >
                İptal
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="primary-button w-full sm:w-auto px-6 font-semibold"
              >
                <span>Profili Kaydet & Başla</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
