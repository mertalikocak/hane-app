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
  const [isSkipped, setIsSkipped] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const configured = isFirebaseConfigured();
    setIsConfigured(configured);

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

  // During SSR or before client mount, render children or simple loader
  if (!isMounted) {
    return null;
  }

  // If Firebase is not configured and not skipped, show the setup gatekeeper
  if (!isConfigured && !isSkipped) {
    return (
      <CloudConnectionGate
        onConnected={() => {
          setIsConfigured(true);
          setIsSkipped(false);
        }}
        onSkipToLocal={() => setIsSkipped(true)}
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
