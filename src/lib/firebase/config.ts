import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

export interface FirebaseConfigOptions {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const STORAGE_KEY_FIREBASE_CONFIG = "hane_firebase_custom_config";

/**
 * Retrieves Firebase config from environment variables or custom UI storage
 */
export function getFirebaseConfig(): FirebaseConfigOptions | null {
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (custom) {
      try {
        const parsed = JSON.parse(custom) as FirebaseConfigOptions;
        if (parsed.apiKey && parsed.projectId && parsed.appId) {
          return parsed;
        }
      } catch {
        // ignore JSON parse error
      }
    }
  }

  const envConfig: FirebaseConfigOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  };

  if (envConfig.apiKey && envConfig.projectId && envConfig.appId) {
    return envConfig;
  }

  return null;
}

export function saveFirebaseCustomConfig(config: FirebaseConfigOptions): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));
    window.dispatchEvent(new Event("hane_firebase_config_updated"));
  }
}

export function removeFirebaseCustomConfig(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
    window.dispatchEvent(new Event("hane_firebase_config_updated"));
  }
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseConfig() !== null;
}

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  const config = getFirebaseConfig();
  if (!config) return null;

  try {
    if (!getApps().length) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApp();
    }
    return appInstance;
  } catch (err) {
    console.error("Firebase initialize error:", err);
    return null;
  }
}

export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) return null;

  try {
    if (!dbInstance) {
      dbInstance = getFirestore(app);
    }
    return dbInstance;
  } catch (err) {
    console.error("Firestore initialize error:", err);
    return null;
  }
}
