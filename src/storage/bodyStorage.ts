import {
  Profile,
  Measurement,
  MuscleMeasurement,
  FullMeasurementRecord,
  ProfileStats,
} from "@/domain/bodyTrackingTypes";
import { calculateBMI } from "@/domain/bodyCalculations";

const STORAGE_KEYS = {
  profiles: "hane_fit_profiles",
  activeProfileId: "hane_fit_active_profile_id",
  measurements: "hane_fit_measurements",
  muscleMeasurements: "hane_fit_muscle_measurements",
};

function safeGetItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return fallback;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage`, e);
  }
}

// ================= PROFILES =================

export function getProfiles(): Profile[] {
  return safeGetItem<Profile[]>(STORAGE_KEYS.profiles, []);
}

export function getProfileById(id: string): Profile | null {
  const profiles = getProfiles();
  return profiles.find((p) => p.id === id) || null;
}

export function saveProfile(
  profileData: Omit<Profile, "id" | "createdAt"> & { id?: string }
): Profile {
  const profiles = getProfiles();
  const now = new Date().toISOString();

  if (profileData.id) {
    const existingIndex = profiles.findIndex((p) => p.id === profileData.id);
    if (existingIndex >= 0) {
      const updated: Profile = {
        ...profiles[existingIndex],
        ...profileData,
        id: profileData.id,
      };
      profiles[existingIndex] = updated;
      safeSetItem(STORAGE_KEYS.profiles, profiles);
      return updated;
    }
  }

  const newProfile: Profile = {
    ...profileData,
    id: profileData.id || `prof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now,
  };

  profiles.push(newProfile);
  safeSetItem(STORAGE_KEYS.profiles, profiles);

  // If no active profile, make this active
  if (!getActiveProfileId()) {
    setActiveProfileId(newProfile.id);
  }

  return newProfile;
}

export function deleteProfile(id: string): void {
  const profiles = getProfiles().filter((p) => p.id !== id);
  safeSetItem(STORAGE_KEYS.profiles, profiles);

  // Also clean up measurements linked to profile
  const measurements = getAllMeasurements().filter((m) => m.profileId !== id);
  safeSetItem(STORAGE_KEYS.measurements, measurements);

  const muscleMeasurements = getAllMuscleMeasurements().filter(
    (mm) => mm.profileId !== id
  );
  safeSetItem(STORAGE_KEYS.muscleMeasurements, muscleMeasurements);

  // If active was deleted, reset active to first profile or null
  if (getActiveProfileId() === id) {
    setActiveProfileId(profiles.length > 0 ? profiles[0].id : "");
  }
}

export function getActiveProfileId(): string {
  if (typeof window === "undefined") return "";
  const profiles = getProfiles();
  if (profiles.length === 0) return "";

  const stored = localStorage.getItem(STORAGE_KEYS.activeProfileId);
  if (stored && profiles.some((p) => p.id === stored)) {
    return stored;
  }

  setActiveProfileId(profiles[0].id);
  return profiles[0].id;
}

export function setActiveProfileId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.activeProfileId, id);
}

// ================= MEASUREMENTS =================

export function getAllMeasurements(): Measurement[] {
  return safeGetItem<Measurement[]>(STORAGE_KEYS.measurements, []);
}

export function getAllMuscleMeasurements(): MuscleMeasurement[] {
  return safeGetItem<MuscleMeasurement[]>(STORAGE_KEYS.muscleMeasurements, []);
}

export function getMeasurementsByProfile(profileId: string): Measurement[] {
  if (!profileId) return [];
  const all = getAllMeasurements();
  return all
    .filter((m) => m.profileId === profileId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getFullMeasurementRecords(
  profileId: string
): FullMeasurementRecord[] {
  if (!profileId) return [];
  const measurements = getMeasurementsByProfile(profileId);
  const muscleMeasurements = getAllMuscleMeasurements().filter(
    (mm) => mm.profileId === profileId
  );

  return measurements.map((m) => ({
    measurement: m,
    muscle: muscleMeasurements.find((mm) => mm.measurementId === m.id),
  }));
}

export function saveMeasurement(
  measurementData: Omit<Measurement, "id" | "createdAt"> & { id?: string },
  muscleData?: Omit<MuscleMeasurement, "id" | "measurementId" | "profileId">
): Measurement {
  const measurements = getAllMeasurements();
  const muscleMeasurements = getAllMuscleMeasurements();
  const now = new Date().toISOString();

  const measurementId =
    measurementData.id ||
    `meas_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newMeasurement: Measurement = {
    ...measurementData,
    id: measurementId,
    createdAt: now,
  };

  // Upsert measurement
  const existingIdx = measurements.findIndex((m) => m.id === measurementId);
  if (existingIdx >= 0) {
    measurements[existingIdx] = newMeasurement;
  } else {
    measurements.push(newMeasurement);
  }
  safeSetItem(STORAGE_KEYS.measurements, measurements);

  // Handle muscle measurement if provided
  if (muscleData) {
    const existingMuscleIdx = muscleMeasurements.findIndex(
      (mm) => mm.measurementId === measurementId
    );
    const newMuscle: MuscleMeasurement = {
      ...muscleData,
      id:
        existingMuscleIdx >= 0
          ? muscleMeasurements[existingMuscleIdx].id
          : `musc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      profileId: measurementData.profileId,
      measurementId,
    };

    if (existingMuscleIdx >= 0) {
      muscleMeasurements[existingMuscleIdx] = newMuscle;
    } else {
      muscleMeasurements.push(newMuscle);
    }
    safeSetItem(STORAGE_KEYS.muscleMeasurements, muscleMeasurements);
  }

  return newMeasurement;
}

export function deleteMeasurement(measurementId: string): void {
  const measurements = getAllMeasurements().filter((m) => m.id !== measurementId);
  safeSetItem(STORAGE_KEYS.measurements, measurements);

  const muscleMeasurements = getAllMuscleMeasurements().filter(
    (mm) => mm.measurementId !== measurementId
  );
  safeSetItem(STORAGE_KEYS.muscleMeasurements, muscleMeasurements);
}

// ================= STATS =================

export function getProfileStats(profileId: string): ProfileStats {
  const profile = getProfileById(profileId);
  const measurements = getMeasurementsByProfile(profileId);

  if (!measurements.length) {
    return { totalMeasurements: 0 };
  }

  // sorted newest first
  const latest = measurements[0];
  const oldest = measurements[measurements.length - 1];

  const weightChange =
    measurements.length > 1
      ? Number((latest.weight - oldest.weight).toFixed(1))
      : 0;

  const bodyFatChange =
    measurements.length > 1 &&
    latest.bodyFat !== undefined &&
    oldest.bodyFat !== undefined
      ? Number((latest.bodyFat - oldest.bodyFat).toFixed(1))
      : undefined;

  const latestBMI = profile
    ? calculateBMI(latest.weight, profile.height) ?? undefined
    : undefined;

  return {
    totalMeasurements: measurements.length,
    latestWeight: latest.weight,
    startWeight: oldest.weight,
    weightChange,
    latestBodyFat: latest.bodyFat,
    startBodyFat: oldest.bodyFat,
    bodyFatChange,
    latestBMI,
    latestMeasurementDate: latest.date,
  };
}
