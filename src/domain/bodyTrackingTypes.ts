export type Gender = "male" | "female";

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  height: number; // cm
  gender: Gender;
  createdAt: string; // ISO string
}

export interface Measurement {
  id: string;
  profileId: string;
  date: string; // YYYY-MM-DD
  weight: number; // kg
  neck: number; // cm
  waist: number; // cm
  hip?: number; // cm (özellikle kadınlar için yağ oranı hesabında kullanılır)
  bodyFat?: number; // % tahmini veya manuel girilmiş vücut yağ oranı
  createdAt: string; // ISO string
}

export interface MuscleMeasurement {
  id: string;
  profileId: string;
  measurementId: string;
  shoulder?: number; // cm
  chest?: number; // cm
  back?: number; // cm
  rightArm?: number; // cm
  leftArm?: number; // cm
  rightThigh?: number; // cm
  leftThigh?: number; // cm
  rightCalf?: number; // cm
  leftCalf?: number; // cm
}

export interface FullMeasurementRecord {
  measurement: Measurement;
  muscle?: MuscleMeasurement;
}

export interface ProfileStats {
  totalMeasurements: number;
  latestWeight?: number;
  startWeight?: number;
  weightChange?: number;
  latestBodyFat?: number;
  startBodyFat?: number;
  bodyFatChange?: number;
  latestBMI?: number;
  latestMeasurementDate?: string;
}
