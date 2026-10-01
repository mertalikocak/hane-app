"use client";

import React, { useState } from "react";
import { useProfile } from "@/context/ProfileContext";
import { Gender } from "@/domain/bodyTrackingTypes";
import { getProfileStats } from "@/storage/bodyStorage";

const AVATAR_GRADIENTS = [
  "from-emerald-500 to-teal-700",
  "from-blue-500 to-indigo-700",
  "from-violet-500 to-purple-800",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-700",
  "from-cyan-500 to-teal-600",
];

export function GlobalProfileModal() {
  const {
    profiles,
    activeProfileId,
    isLoaded,
    isModalOpen,
    modalView,
    isSessionTimedOut,
    setActiveProfileId,
    createProfile,
    closeProfileModal,
    openProfileModal,
  } = useProfile();

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [height, setHeight] = useState<string | number>("");
  const [gender, setGender] = useState<Gender>("male");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoaded || !isModalOpen) return null;

  const getInitials = (first: string, last?: string) => {
    const f = first ? first[0].toUpperCase() : "";
    const l = last ? last[0].toUpperCase() : "";
    return `${f}${l}` || "👤";
  };

  const handleSelect = (id: string) => {
    setActiveProfileId(id);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    const result = createProfile({
      firstName,
      lastName,
      height,
      gender,
    });

    if (result.errors) {
      setFormErrors(result.errors as Record<string, string>);
      setIsSubmitting(false);
      return;
    }

    // Reset form
    setFirstName("");
    setLastName("");
    setHeight("");
    setGender("male");
    setIsSubmitting(false);
  };

  const isClosable = profiles.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => {
        if (isClosable) closeProfileModal();
      }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border/80 bg-surface/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button if closable */}
        {isClosable && (
          <button
            type="button"
            onClick={closeProfileModal}
            className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-2xl bg-surface-raised border border-border/60 text-muted hover:text-foreground text-sm cursor-pointer transition"
            aria-label="Kapat"
          >
            ✕
          </button>
        )}

        {/* VIEW 1: SELECT PROFILE */}
        {modalView === "select" && profiles.length > 0 ? (
          <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary">
                <span>👤</span> HANE KULLANICI PROFİLİ
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Kim Kullanıyor?
              </h2>
              <p className="text-xs sm:text-sm text-muted max-w-md mx-auto">
                Harcamalarınız, yemek planlarınız ve fit ölçümleriniz için profilinizi seçin.
              </p>
            </div>

            {/* Profile Cards Grid */}
            <div className="flex flex-wrap items-stretch justify-center gap-4 sm:gap-6 pt-2">
              {profiles.map((p, index) => {
                const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
                const initials = getInitials(p.firstName, p.lastName);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p.id)}
                    className="group relative flex flex-col items-center justify-between p-4 w-36 h-44 sm:w-44 sm:h-52 rounded-3xl border-2 border-border/80 bg-surface hover:border-primary hover:bg-surface-raised transition-all duration-200 cursor-pointer text-center hover:scale-105 active:scale-95 shadow-xs"
                  >
                    <div className="relative mt-1">
                      <div
                        className={`flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white font-black text-2xl sm:text-3xl shadow-md group-hover:scale-105 transition-transform`}
                      >
                        {initials}
                      </div>
                      <span className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface/90 text-xs shadow-xs">
                        {p.gender === "male" ? "👨" : "👩"}
                      </span>
                    </div>

                    <div className="w-full text-center px-1 mb-1">
                      <span className="block text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {p.firstName} {p.lastName}
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Add New Profile Card */}
              <button
                type="button"
                onClick={() => openProfileModal("create")}
                className="group flex flex-col items-center justify-between p-4 w-36 h-44 sm:w-44 sm:h-52 rounded-3xl border-2 border-dashed border-border/80 bg-surface/50 hover:bg-surface hover:border-primary/70 transition-all duration-200 cursor-pointer text-center hover:scale-105 active:scale-95 shadow-xs"
              >
                <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-surface-raised border border-border/60 text-2xl sm:text-3xl font-light text-muted group-hover:text-primary group-hover:bg-primary/10 group-hover:border-primary/30 transition-all mt-1">
                  +
                </div>
                <div className="w-full text-center px-1 mb-1">
                  <span className="block text-sm sm:text-base font-bold text-muted group-hover:text-foreground transition-colors truncate">
                    Yeni Profil
                  </span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* VIEW 2: CREATE PROFILE */
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-2 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-2xl shadow-md text-white">
                👤
              </div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                {profiles.length === 0
                  ? "Hane App'e Hoş Geldiniz!"
                  : "Yeni Profil Oluştur"}
              </h2>
              <p className="text-xs sm:text-sm text-muted max-w-md mx-auto">
                {profiles.length === 0
                  ? "Uygulamayı kullanmaya başlamak için ilk profilinizi oluşturun."
                  : "Hane içindeki diğer kişiler için yeni bir profil oluşturun."}
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 max-w-md mx-auto">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Ad *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Örn: Mert"
                  className="field w-full"
                />
                {formErrors.firstName && (
                  <span className="text-[11px] text-rose-500 mt-1 block">
                    {formErrors.firstName}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Soyad
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Örn: Koçak"
                  className="field w-full"
                />
                {formErrors.lastName && (
                  <span className="text-[11px] text-rose-500 mt-1 block">
                    {formErrors.lastName}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Boy (cm) *
                  </label>
                  <input
                    type="number"
                    required
                    min="80"
                    max="250"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="178"
                    className="field w-full"
                  />
                  {formErrors.height && (
                    <span className="text-[11px] text-rose-500 mt-1 block">
                      {formErrors.height}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Cinsiyet *
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="field w-full"
                  >
                    <option value="male">Erkek 👨</option>
                    <option value="female">Kadın 👩</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full primary-button bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 py-3 text-sm font-bold text-white shadow-md cursor-pointer"
                >
                  {isSubmitting ? "Kaydediliyor..." : "Profili Kaydet ve Başla"}
                </button>

                {profiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => openProfileModal("select")}
                    className="w-full text-xs text-muted hover:text-foreground py-2 cursor-pointer transition"
                  >
                    ← Kayıtlı Profillere Dön
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
