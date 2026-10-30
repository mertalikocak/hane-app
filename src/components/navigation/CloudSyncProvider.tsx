"use client";

import { useEffect, useState, createContext, useContext } from "react";
import {
  startRealtimeCloudSync,
  subscribeSyncState,
  SyncState,
  pushLocalToCloud,
  pullCloudToLocal,
  deleteCloudData,
} from "@/lib/firebase/syncService";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { CloudConnectionGate } from "./CloudConnectionGate";

const LOCAL_MODE_SKIP_KEY = "hane_cloud_gate_skipped";

interface CloudSyncContextType {
  syncState: SyncState;
  isConfigured: boolean;
  pushNow: () => Promise<{ success: boolean; error?: string }>;
  pullNow: () => Promise<{ success: boolean; error?: string }>;
  deleteCloudNow: () => Promise<{ success: boolean; error?: string }>;
}

const CloudSyncContext = createContext<CloudSyncContextType>({
  syncState: { status: "unconfigured", lastSyncedAt: null },
  isConfigured: false,
  pushNow: async () => ({ success: false }),
  pullNow: async () => ({ success: false }),
  deleteCloudNow: async () => ({ success: false }),
});

export function useCloudSync() {
  return useContext(CloudSyncContext);
}

export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
  const [syncState, setSyncState] = useState<SyncState>({
    status: "unconfigured",
    lastSyncedAt: null,
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSkipped, setIsSkipped] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    let configured = false;
    let skipped = false;
    try {
      configured = isFirebaseConfigured();
      skipped = localStorage.getItem(LOCAL_MODE_SKIP_KEY) === "true";
    } catch {
      // If localStorage is restricted (e.g. iOS Safari Private/strict mode), default to local mode so UI never blocks
      skipped = true;
    }

    setIsConfigured(configured);
    setIsSkipped(configured || skipped);
    setIsMounted(true);

    const unsubscribeSync = subscribeSyncState((state) => {
      setSyncState(state);
    });

    const cleanupRealtime = startRealtimeCloudSync();

    const handleConfigUpdate = () => {
      const isNowConfigured = isFirebaseConfigured();
      setIsConfigured(isNowConfigured);
      if (isNowConfigured) {
        setIsSkipped(false);
      }
      startRealtimeCloudSync();
    };

    window.addEventListener("hane_firebase_config_updated", handleConfigUpdate);

    return () => {
      unsubscribeSync();
      cleanupRealtime();
      window.removeEventListener("hane_firebase_config_updated", handleConfigUpdate);
    };
  }, []);

  if (isMounted && !isConfigured && !isSkipped) {
    return (
      <CloudConnectionGate
        onConnected={() => {
          setIsConfigured(true);
          setIsSkipped(false);
        }}
        onSkipToLocal={() => {
          try {
            localStorage.setItem(LOCAL_MODE_SKIP_KEY, "true");
          } catch {
            // ignore storage errors
          }
          setIsSkipped(true);
        }}
      />
    );
  }

  return (
    <CloudSyncContext.Provider
      value={{
        syncState,
        isConfigured,
        pushNow: pushLocalToCloud,
        pullNow: pullCloudToLocal,
        deleteCloudNow: deleteCloudData,
      }}
    >
      {children}
    </CloudSyncContext.Provider>
  );
}
