"use client";

import React, { useState } from "react";
import { useProfile } from "@/context/ProfileContext";
import { Gender } from "@/domain/bodyTrackingTypes";
import { CloseIcon, PlusIcon, UserIcon } from "@/components/ui/Icons";

export function GlobalProfileModal() {
  const {
    profiles,
    isLoaded,
    isModalOpen,
    modalView,
    setActiveProfileId,
    createProfile,
    closeProfileModal,
    openProfileModal,
  } = useProfile();

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
    return `${f}${l}` || "K";
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

    setFirstName("");
    setLastName("");
    setHeight("");
    setGender("male");
    setIsSubmitting(false);
  };

  const isClosable = profiles.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#30263A]/45 backdrop-blur-[2px] transition-opacity duration-200"
      onClick={() => {
        if (isClosable) closeProfileModal();
      }}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[18px] border border-border bg-surface p-6 sm:p-8 shadow-[var(--shadow-lg)] space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {isClosable && (
          <button
            type="button"
            onClick={closeProfileModal}
            className="absolute top-5 right-5 icon-button"
            aria-label="Kapat"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        )}

        {modalView === "select" && profiles.length > 0 ? (
          <div className="space-y-6 text-center">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-border-lavender bg-accent px-2.5 py-1 text-xs font-semibold text-foreground">
                <UserIcon className="h-3.5 w-3.5 text-primary" />
                <span>Hane Kullanıcı Profili</span>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Kim Kullanıyor?
              </h2>
              <p className="text-sm text-foreground-secondary max-w-md mx-auto">
                Harcamalarınız, yemek planlarınız ve kişisel ölçümleriniz için profilinizi seçin.
              </p>
            </div>

            <div className="flex flex-wrap items-stretch justify-center gap-4 pt-1">
              {profiles.map((p) => {
                const initials = getInitials(p.firstName, p.lastName);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p.id)}
                    className="group flex flex-col items-center justify-between p-4 w-36 h-40 sm:w-40 sm:h-44 rounded-[14px] border border-border bg-surface hover:border-primary hover:bg-surface-lavender transition-colors duration-150 cursor-pointer text-center shadow-[var(--shadow-xs)]"
                  >
                    <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-[14px] bg-accent border border-border-lavender text-primary font-bold text-xl sm:text-2xl group-hover:bg-primary group-hover:text-white transition-colors duration-150 mt-1">
                      {initials}
                    </div>

                    <div className="w-full text-center px-1">
                      <span className="block text-sm font-semibold text-foreground truncate">
                        {p.firstName} {p.lastName}
                      </span>
                      <span className="block text-[11px] text-muted mt-0.5">
                        {p.gender === "male" ? "Erkek" : "Kadın"} • {p.height} cm
                      </span>
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => openProfileModal("create")}
                className="group flex flex-col items-center justify-between p-4 w-36 h-40 sm:w-40 sm:h-44 rounded-[14px] border border-dashed border-border-strong bg-background/60 hover:bg-surface hover:border-primary transition-colors duration-150 cursor-pointer text-center"
              >
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-[14px] bg-surface border border-border text-muted group-hover:text-primary group-hover:border-border-lavender transition-colors duration-150 mt-1">
                  <PlusIcon className="h-6 w-6" />
                </div>
                <div className="w-full text-center px-1">
                  <span className="block text-sm font-semibold text-foreground-secondary group-hover:text-foreground">
                    Yeni Profil
                  </span>
                  <span className="block text-[11px] text-muted mt-0.5">
                    Kişi ekle
                  </span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-1.5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px] bg-accent border border-border-lavender text-primary">
                <UserIcon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {profiles.length === 0
                  ? "Hane App'e Hoş Geldiniz"
                  : "Yeni Profil Oluştur"}
              </h2>
              <p className="text-sm text-foreground-secondary max-w-md mx-auto">
                {profiles.length === 0
                  ? "Uygulamayı kullanmaya başlamak için ilk hane profilinizi oluşturun."
                  : "Hane içindeki diğer kişiler için yeni bir profil oluşturun."}
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 max-w-md mx-auto">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Ad *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Örn: Mert"
                  className="field"
                />
                {formErrors.firstName && (
                  <span className="text-xs text-danger mt-1 block">
                    {formErrors.firstName}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Soyad
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Örn: Koçak"
                  className="field"
                />
                {formErrors.lastName && (
                  <span className="text-xs text-danger mt-1 block">
                    {formErrors.lastName}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
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
                    className="field"
                  />
                  {formErrors.height && (
                    <span className="text-xs text-danger mt-1 block">
                      {formErrors.height}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Cinsiyet *
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="field"
                  >
                    <option value="male">Erkek</option>
                    <option value="female">Kadın</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full primary-button py-2.5"
                >
                  {isSubmitting ? "Kaydediliyor..." : "Profili Kaydet ve Başla"}
                </button>

                {profiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => openProfileModal("select")}
                    className="w-full secondary-button py-2 text-xs"
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
