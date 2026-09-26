import { Gender } from "./bodyTrackingTypes";

export interface BodyFatCalculationParams {
  gender: Gender;
  height: number;
  neck?: number | null;
  waist?: number | null;
  hip?: number | null;
}

/**
 * U.S. Navy Circumference Method Formula for Body Fat % Estimation
 * All inputs must be in centimeters (cm).
 *
 * MALE FORMULA:
 *   %BF = 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
 *   Required: height, waist, neck (waist > neck)
 *
 * FEMALE FORMULA:
 *   %BF = 495 / (1.29579 - 0.35004 * log10(waist + hip - neck) + 0.22100 * log10(height)) - 450
 *   Required: height, waist, neck, hip (waist + hip > neck)
 *
 * If any required measurement is missing, non-positive, or produces a mathematical error,
 * the function safely returns `null` without throwing NaN or Infinity.
 *
 * @param params Calculation parameters
 * @returns Rounded 1-decimal percentage value (e.g., 23.7) or null if incomplete/invalid
 */
export function calculateBodyFat(params: BodyFatCalculationParams): number | null {
  const { gender, height, neck, waist, hip } = params;

  // Height is mandatory and must be positive
  if (!height || typeof height !== "number" || height <= 0 || !Number.isFinite(height)) {
    return null;
  }

  // 1. MALE CALCULATION
  if (gender === "male") {
    // Both neck and waist are required for males
    if (
      typeof neck !== "number" ||
      typeof waist !== "number" ||
      neck <= 0 ||
      waist <= 0 ||
      !Number.isFinite(neck) ||
      !Number.isFinite(waist)
    ) {
      return null;
    }

    const diff = waist - neck;
    // Log argument must be strictly positive
    if (diff <= 0) {
      return null;
    }

    try {
      const denominator =
        1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(height);

      if (denominator <= 0 || !Number.isFinite(denominator)) {
        return null;
      }

      const bodyFat = 495 / denominator - 450;

      if (isNaN(bodyFat) || !Number.isFinite(bodyFat)) {
        return null;
      }

      // Realistic physiological clamping (2% to 70%)
      const clamped = Math.max(2, Math.min(70, bodyFat));
      return Number(clamped.toFixed(1));
    } catch {
      return null;
    }
  }

  // 2. FEMALE CALCULATION
  if (gender === "female") {
    // Neck, waist, and hip are all required for females
    if (
      typeof neck !== "number" ||
      typeof waist !== "number" ||
      typeof hip !== "number" ||
      neck <= 0 ||
      waist <= 0 ||
      hip <= 0 ||
      !Number.isFinite(neck) ||
      !Number.isFinite(waist) ||
      !Number.isFinite(hip)
    ) {
      return null;
    }

    const diff = waist + hip - neck;
    // Log argument must be strictly positive
    if (diff <= 0) {
      return null;
    }

    try {
      const denominator =
        1.29579 - 0.35004 * Math.log10(diff) + 0.221 * Math.log10(height);

      if (denominator <= 0 || !Number.isFinite(denominator)) {
        return null;
      }

      const bodyFat = 495 / denominator - 450;

      if (isNaN(bodyFat) || !Number.isFinite(bodyFat)) {
        return null;
      }

      // Realistic physiological clamping (5% to 75%)
      const clamped = Math.max(5, Math.min(75, bodyFat));
      return Number(clamped.toFixed(1));
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Backward-compatible helper for U.S. Navy Method
 */
export function calculateBodyFatNavy(
  gender: Gender,
  height: number,
  neck?: number | null,
  waist?: number | null,
  hip?: number | null
): number | null {
  return calculateBodyFat({ gender, height, neck, waist, hip });
}

/**
 * Formats body fat number to string representation with 1 decimal and % symbol.
 * Example: 23.7 -> "23.7%"
 */
export function formatBodyFat(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val) || !Number.isFinite(val)) {
    return "—";
  }
  return `${Number(val.toFixed(1))}%`;
}

/**
 * Calculates Body Mass Index (BMI).
 * weight in kg, height in cm.
 */
export function calculateBMI(weight: number, height: number): number | null {
  if (!weight || weight <= 0 || !height || height <= 0 || !Number.isFinite(weight) || !Number.isFinite(height)) {
    return null;
  }
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  if (isNaN(bmi) || !Number.isFinite(bmi)) return null;
  return Number(bmi.toFixed(1));
}

/**
 * Returns descriptive tag and color for BMI
 */
export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Zayıf", color: "text-blue-500" };
  if (bmi < 25) return { label: "Normal", color: "text-emerald-500" };
  if (bmi < 30) return { label: "Fazla Kilolu", color: "text-amber-500" };
  return { label: "Obezite", color: "text-rose-500" };
}

/**
 * Returns general category for Body Fat % based on gender
 */
export function getBodyFatCategory(
  gender: Gender,
  bodyFat: number
): { label: string; color: string } {
  if (gender === "male") {
    if (bodyFat < 6) return { label: "Esansiyel Yağ", color: "text-blue-500" };
    if (bodyFat <= 13) return { label: "Atletik", color: "text-emerald-500" };
    if (bodyFat <= 17) return { label: "Fit", color: "text-emerald-600" };
    if (bodyFat <= 24) return { label: "Ortalama", color: "text-amber-500" };
    return { label: "Yüksek", color: "text-rose-500" };
  } else {
    if (bodyFat < 14) return { label: "Esansiyel Yağ", color: "text-blue-500" };
    if (bodyFat <= 20) return { label: "Atletik", color: "text-emerald-500" };
    if (bodyFat <= 24) return { label: "Fit", color: "text-emerald-600" };
    if (bodyFat <= 31) return { label: "Ortalama", color: "text-amber-500" };
    return { label: "Yüksek", color: "text-rose-500" };
  }
}
