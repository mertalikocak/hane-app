import { doc, getDoc, setDoc, deleteDoc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "./config";
import { tumHaneVerileriniTopla, tumHaneVerileriniIceAktar } from "@/storage/tumHaneYedekDeposu";

export type SyncStatus = "unconfigured" | "connecting" | "synced" | "syncing" | "error" | "offline";

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  errorMessage?: string;
}

const VAULT_COLLECTION = "hane_vaults";
const VAULT_DOC_ID = "main_data";

let isApplyingRemoteChange = false;
let pushDebounceTimer: NodeJS.Timeout | null = null;
let activeFirestoreUnsubscribe: Unsubscribe | null = null;

let currentSyncState: SyncState = {
  status: "unconfigured",
  lastSyncedAt: null,
};

const listeners = new Set<(state: SyncState) => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn({ ...currentSyncState }));
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("hane_sync_state_changed", { detail: { ...currentSyncState } })
    );
  }
}

export function getSyncState(): SyncState {
  return { ...currentSyncState };
}

export function subscribeSyncState(fn: (state: SyncState) => void): () => void {
  listeners.add(fn);
  fn({ ...currentSyncState });
  return () => listeners.delete(fn);
}

/**
 * Pushes all current local data to Firestore
 */
export async function pushLocalToCloud(): Promise<{ success: boolean; error?: string }> {
  const db = getFirebaseDb();
  if (!db) {
    currentSyncState = {
      status: isFirebaseConfigured() ? "error" : "unconfigured",
      lastSyncedAt: currentSyncState.lastSyncedAt,
      errorMessage: "Firebase veritabanı başlatılamadı.",
    };
    notifyListeners();
    return { success: false, error: "Firebase veritabanı başlatılamadı." };
  }

  currentSyncState = {
    ...currentSyncState,
    status: "syncing",
  };
  notifyListeners();

  try {
    const localPacket = tumHaneVerileriniTopla();
    const docRef = doc(db, VAULT_COLLECTION, VAULT_DOC_ID);

    await setDoc(
      docRef,
      {
        uygulama: "hane-app",
        guncellemeTarihi: new Date().toISOString(),
        ozet: localPacket.ozet,
        veriler: localPacket.veriler,
      },
      { merge: true }
    );

    currentSyncState = {
      status: "synced",
      lastSyncedAt: new Date(),
    };
    notifyListeners();
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    currentSyncState = {
      status: "error",
      lastSyncedAt: currentSyncState.lastSyncedAt,
      errorMessage: msg,
    };
    notifyListeners();
    return { success: false, error: msg };
  }
}

/**
 * Pulls latest data from Firestore and merges into LocalStorage
 */
export async function pullCloudToLocal(): Promise<{ success: boolean; error?: string }> {
  const db = getFirebaseDb();
  if (!db) {
    return { success: false, error: "Firebase veritabanı bulunamadı." };
  }

  currentSyncState = {
    ...currentSyncState,
    status: "syncing",
  };
  notifyListeners();

  try {
    const docRef = doc(db, VAULT_COLLECTION, VAULT_DOC_ID);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data?.veriler && typeof data.veriler === "object") {
        isApplyingRemoteChange = true;
        tumHaneVerileriniIceAktar(data.veriler);
        setTimeout(() => {
          isApplyingRemoteChange = false;
        }, 500);
      }
    }

    currentSyncState = {
      status: "synced",
      lastSyncedAt: new Date(),
    };
    notifyListeners();
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    currentSyncState = {
      status: "error",
      lastSyncedAt: currentSyncState.lastSyncedAt,
      errorMessage: msg,
    };
    notifyListeners();
    return { success: false, error: msg };
  }
}

/**
 * Deletes the cloud vault document from Firestore
 */
export async function deleteCloudData(): Promise<{ success: boolean; error?: string }> {
  const db = getFirebaseDb();
  if (!db) {
    return { success: false, error: "Firebase veritabanı bulunamadı." };
  }

  currentSyncState = {
    ...currentSyncState,
    status: "syncing",
  };
  notifyListeners();

  try {
    const docRef = doc(db, VAULT_COLLECTION, VAULT_DOC_ID);
    await deleteDoc(docRef);

    currentSyncState = {
      status: "synced",
      lastSyncedAt: new Date(),
    };
    notifyListeners();
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    currentSyncState = {
      status: "error",
      lastSyncedAt: currentSyncState.lastSyncedAt,
      errorMessage: msg,
    };
    notifyListeners();
    return { success: false, error: msg };
  }
}

/**
 * Debounced trigger for pushing local changes when user adds/edits data
 */
export function queueLocalChangePush() {
  if (isApplyingRemoteChange) return;
  if (!isFirebaseConfigured()) return;

  if (pushDebounceTimer) {
    clearTimeout(pushDebounceTimer);
  }

  pushDebounceTimer = setTimeout(() => {
    pushLocalToCloud();
  }, 1200);
}

/**
 * Initializes real-time listener subscription to Firestore document
 */
export function startRealtimeCloudSync(): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  if (activeFirestoreUnsubscribe) {
    activeFirestoreUnsubscribe();
    activeFirestoreUnsubscribe = null;
  }

  if (!isFirebaseConfigured()) {
    currentSyncState = {
      status: "unconfigured",
      lastSyncedAt: null,
    };
    notifyListeners();
    return () => {};
  }

  const db = getFirebaseDb();
  if (!db) {
    currentSyncState = {
      status: "error",
      lastSyncedAt: null,
      errorMessage: "Firebase bağlantısı kurulamadı.",
    };
    notifyListeners();
    return () => {};
  }

  currentSyncState = {
    status: "connecting",
    lastSyncedAt: currentSyncState.lastSyncedAt,
  };
  notifyListeners();

  const docRef = doc(db, VAULT_COLLECTION, VAULT_DOC_ID);

  activeFirestoreUnsubscribe = onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data?.veriler && typeof data.veriler === "object") {
          // Compare if remote has changes before applying to prevent infinite echo
          const localPacket = tumHaneVerileriniTopla();
          const remoteJson = JSON.stringify(data.veriler);
          const localJson = JSON.stringify(localPacket.veriler);

          if (remoteJson !== localJson) {
            isApplyingRemoteChange = true;
            tumHaneVerileriniIceAktar(data.veriler);
            setTimeout(() => {
              isApplyingRemoteChange = false;
            }, 500);
          }
        }
      } else {
        // If document doesn't exist yet on cloud, push initial local data
        pushLocalToCloud();
      }

      currentSyncState = {
        status: "synced",
        lastSyncedAt: new Date(),
      };
      notifyListeners();
    },
    (err) => {
      console.error("Firestore sync listener error:", err);
      currentSyncState = {
        status: "error",
        lastSyncedAt: currentSyncState.lastSyncedAt,
        errorMessage: err.message,
      };
      notifyListeners();
    }
  );

  // Hook into local storage update events
  const handleLocalUpdate = () => {
    queueLocalChangePush();
  };

  const syncEvents = [
    "storage",
    "fit_measurements_updated",
    "fit_profiles_updated",
    "cardo:expenses-updated",
    "hane-gider:updated",
    "hane-dinner:storage",
    "tum-hane-verileri-guncellendi",
  ];

  syncEvents.forEach((ev) => window.addEventListener(ev, handleLocalUpdate));

  return () => {
    if (activeFirestoreUnsubscribe) {
      activeFirestoreUnsubscribe();
      activeFirestoreUnsubscribe = null;
    }
    syncEvents.forEach((ev) => window.removeEventListener(ev, handleLocalUpdate));
  };
}
