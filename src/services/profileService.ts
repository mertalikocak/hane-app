import { Gender, Profile } from "@/domain/bodyTrackingTypes";
import {
  getProfiles,
  getProfileById,
  saveProfile as saveProfileToStorage,
  deleteProfile as deleteProfileFromStorage,
  getActiveProfileId,
  setActiveProfileId,
} from "@/storage/bodyStorage";

export interface CreateProfileInput {
  firstName: string;
  lastName: string;
  height: number | string;
  gender: Gender;
}

export interface ProfileValidationErrors {
  firstName?: string;
  lastName?: string;
  height?: string;
  gender?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ProfileValidationErrors;
}

/**
 * Validates profile creation input according to strict domain rules.
 */
export function validateProfileInput(
  input: CreateProfileInput
): ValidationResult {
  const errors: ProfileValidationErrors = {};

  // First Name validation
  const trimmedFirst = (input.firstName || "").trim();
  if (!trimmedFirst) {
    errors.firstName = "İsim alanı boş bırakılamaz.";
  } else if (trimmedFirst.length < 2) {
    errors.firstName = "İsim en az 2 karakter olmalıdır.";
  } else if (trimmedFirst.length > 40) {
    errors.firstName = "İsim en fazla 40 karakter olabilir.";
  }

  // Last Name validation
  const trimmedLast = (input.lastName || "").trim();
  if (!trimmedLast) {
    errors.lastName = "Soyisim alanı boş bırakılamaz.";
  } else if (trimmedLast.length < 2) {
    errors.lastName = "Soyisim en az 2 karakter olmalıdır.";
  } else if (trimmedLast.length > 40) {
    errors.lastName = "Soyisim en fazla 40 karakter olabilir.";
  }

  // Height validation
  if (
    input.height === "" ||
    input.height === null ||
    input.height === undefined
  ) {
    errors.height = "Boy bilgisi boş bırakılamaz.";
  } else {
    const parsedHeight =
      typeof input.height === "number" ? input.height : Number(input.height);
    if (isNaN(parsedHeight)) {
      errors.height = "Boy sadece sayısal bir değer olmalıdır.";
    } else if (parsedHeight < 80 || parsedHeight > 250) {
      errors.height = "Boy 80 cm ile 250 cm arasında mantıklı bir değer olmalıdır.";
    }
  }

  // Gender validation
  if (!input.gender || (input.gender !== "male" && input.gender !== "female")) {
    errors.gender = "Lütfen geçerli bir cinsiyet seçiniz.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Profile service handling business logic, validation, ID generation and reactive events.
 */
export const ProfileService = {
  getAll(): Profile[] {
    return getProfiles();
  },

  getById(id: string): Profile | null {
    return getProfileById(id);
  },

  getActive(): Profile | null {
    const activeId = getActiveProfileId();
    if (!activeId) {
      const all = getProfiles();
      return all[0] || null;
    }
    return getProfileById(activeId);
  },

  setActive(id: string): void {
    setActiveProfileId(id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("fit_profile_changed"));
    }
  },

  create(input: CreateProfileInput): { profile?: Profile; errors?: ProfileValidationErrors } {
    const validation = validateProfileInput(input);
    if (!validation.isValid) {
      return { errors: validation.errors };
    }

    const uniqueId = `prof_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const parsedHeight =
      typeof input.height === "number" ? input.height : Number(input.height);

    const newProfile = saveProfileToStorage({
      id: uniqueId,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      height: Math.round(parsedHeight * 10) / 10,
      gender: input.gender,
    });

    // Make newly created profile active
    this.setActive(newProfile.id);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("fit_profiles_updated"));
    }

    return { profile: newProfile };
  },

  delete(id: string): void {
    deleteProfileFromStorage(id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("fit_profiles_updated"));
      window.dispatchEvent(new Event("fit_profile_changed"));
    }
  },
};
