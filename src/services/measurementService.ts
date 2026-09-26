import { Measurement, Profile, MuscleMeasurement } from "@/domain/bodyTrackingTypes";
import { calculateBodyFat } from "@/domain/bodyCalculations";
import {
  saveMeasurement as saveMeasurementToStorage,
  deleteMeasurement as deleteMeasurementFromStorage,
} from "@/storage/bodyStorage";
import { ProfileService } from "./profileService";

export interface CreateMeasurementInput {
  id?: string;
  profileId: string;
  date: string;
  weight: number | string;
  neck?: number | string | null;
  waist?: number | string | null;
  hip?: number | string | null;
}

export interface CreateMuscleMeasurementInput {
  shoulder?: number | string | null;
  chest?: number | string | null;
  back?: number | string | null;
  rightArm?: number | string | null;
  leftArm?: number | string | null;
  rightThigh?: number | string | null;
  leftThigh?: number | string | null;
  rightCalf?: number | string | null;
  leftCalf?: number | string | null;
}

export interface MeasurementValidationErrors {
  date?: string;
  weight?: string;
  neck?: string;
  waist?: string;
  hip?: string;
}

export interface MeasurementValidationResult {
  isValid: boolean;
  errors: MeasurementValidationErrors;
}

function parseOptionalNumber(val: number | string | null | undefined): number | undefined {
  if (val === "" || val === null || val === undefined) return undefined;
  const num = typeof val === "number" ? val : Number(String(val).replace(",", "."));
  if (isNaN(num) || !isFinite(num)) return undefined;
  return Math.round(num * 10) / 10;
}

/**
 * Validates measurement input according to domain requirements.
 * Only `date` and `weight` are strictly required.
 */
export function validateMeasurementInput(
  input: CreateMeasurementInput
): MeasurementValidationResult {
  const errors: MeasurementValidationErrors = {};

  // Date validation
  if (!input.date || !input.date.trim()) {
    errors.date = "Tarih alanı zorunludur.";
  }

  // Weight validation (Required)
  if (
    input.weight === "" ||
    input.weight === null ||
    input.weight === undefined
  ) {
    errors.weight = "Kilo alanı zorunludur.";
  } else {
    const raw = String(input.weight).replace(",", ".");
    const parsedWeight = Number(raw);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      errors.weight = "Geçerli bir kilo değeri giriniz.";
    } else if (parsedWeight < 20 || parsedWeight > 400) {
      errors.weight = "Kilo 20 kg ile 400 kg arasında olmalıdır.";
    }
  }

  // Optional Neck validation
  if (input.neck !== "" && input.neck !== null && input.neck !== undefined) {
    const parsed = parseOptionalNumber(input.neck);
    if (parsed === undefined || parsed < 15 || parsed > 90) {
      errors.neck = "Boyun ölçüsü 15 cm ile 90 cm arasında olmalıdır.";
    }
  }

  // Optional Waist validation
  if (input.waist !== "" && input.waist !== null && input.waist !== undefined) {
    const parsed = parseOptionalNumber(input.waist);
    if (parsed === undefined || parsed < 30 || parsed > 250) {
      errors.waist = "Bel ölçüsü 30 cm ile 250 cm arasında olmalıdır.";
    }
  }

  // Optional Hip validation
  if (input.hip !== "" && input.hip !== null && input.hip !== undefined) {
    const parsed = parseOptionalNumber(input.hip);
    if (parsed === undefined || parsed < 30 || parsed > 250) {
      errors.hip = "Kalça ölçüsü 30 cm ile 250 cm arasında olmalıdır.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * MeasurementService provides business logic and storage operations for body measurements and linked muscle measurements.
 */
export const MeasurementService = {
  create(
    input: CreateMeasurementInput,
    profile?: Profile | null,
    muscleInput?: CreateMuscleMeasurementInput | null
  ): { measurement?: Measurement; errors?: MeasurementValidationErrors } {
    const validation = validateMeasurementInput(input);
    if (!validation.isValid) {
      return { errors: validation.errors };
    }

    const currentProfile = profile || ProfileService.getById(input.profileId);
    if (!currentProfile) {
      return { errors: { weight: "Geçerli bir profil bulunamadı." } };
    }

    const rawWeight = String(input.weight).replace(",", ".");
    const parsedWeight = Number(rawWeight);

    const parsedNeck = parseOptionalNumber(input.neck);
    const parsedWaist = parseOptionalNumber(input.waist);
    const parsedHip = parseOptionalNumber(input.hip);

    // Calculate bodyFat via calculateBodyFat utility
    const calculatedBodyFat = calculateBodyFat({
      gender: currentProfile.gender,
      height: currentProfile.height,
      neck: parsedNeck,
      waist: parsedWaist,
      hip: parsedHip,
    });

    // Parse optional muscle measurements
    let muscleData: Omit<MuscleMeasurement, "id" | "measurementId" | "profileId"> | undefined = undefined;

    if (muscleInput) {
      const shoulder = parseOptionalNumber(muscleInput.shoulder);
      const chest = parseOptionalNumber(muscleInput.chest);
      const back = parseOptionalNumber(muscleInput.back);
      const rightArm = parseOptionalNumber(muscleInput.rightArm);
      const leftArm = parseOptionalNumber(muscleInput.leftArm);
      const rightThigh = parseOptionalNumber(muscleInput.rightThigh);
      const leftThigh = parseOptionalNumber(muscleInput.leftThigh);
      const rightCalf = parseOptionalNumber(muscleInput.rightCalf);
      const leftCalf = parseOptionalNumber(muscleInput.leftCalf);

      const hasAnyMuscle =
        shoulder !== undefined ||
        chest !== undefined ||
        back !== undefined ||
        rightArm !== undefined ||
        leftArm !== undefined ||
        rightThigh !== undefined ||
        leftThigh !== undefined ||
        rightCalf !== undefined ||
        leftCalf !== undefined;

      if (hasAnyMuscle) {
        muscleData = {
          shoulder,
          chest,
          back,
          rightArm,
          leftArm,
          rightThigh,
          leftThigh,
          rightCalf,
          leftCalf,
        };
      }
    }

    const saved = saveMeasurementToStorage(
      {
        id: input.id,
        profileId: currentProfile.id,
        date: input.date,
        weight: Math.round(parsedWeight * 10) / 10,
        neck: parsedNeck !== undefined ? Math.round(parsedNeck * 10) / 10 : 0,
        waist: parsedWaist !== undefined ? Math.round(parsedWaist * 10) / 10 : 0,
        hip: parsedHip !== undefined ? Math.round(parsedHip * 10) / 10 : undefined,
        bodyFat: calculatedBodyFat ?? undefined,
      },
      muscleData
    );

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("fit_measurements_updated"));
    }

    return { measurement: saved };
  },

  delete(id: string): void {
    deleteMeasurementFromStorage(id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("fit_measurements_updated"));
    }
  },
};
