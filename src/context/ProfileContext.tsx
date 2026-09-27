"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Profile, Gender } from "@/domain/bodyTrackingTypes";
import { ProfileService, CreateProfileInput, ProfileValidationErrors } from "@/services/profileService";

export const PROFILE_TIMEOUT_MS = 6 * 60 * 60 * 1000; // 6 hours in ms
export const PROFILE_SELECTED_AT_KEY = "hane_profile_selected_at";

interface ProfileContextType {
  profiles: Profile[];
  activeProfile: Profile | null;
  activeProfileId: string;
  isLoaded: boolean;
  isModalOpen: boolean;
  modalView: "select" | "create";
  isSessionTimedOut: boolean;
  setActiveProfileId: (id: string) => void;
  createProfile: (input: CreateProfileInput) => { profile?: Profile; errors?: ProfileValidationErrors };
  deleteProfile: (id: string) => void;
  openProfileModal: (view?: "select" | "create") => void;
  closeProfileModal: () => void;
  refreshProfiles: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveIdState] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalView, setModalView] = useState<"select" | "create">("select");
  const [isSessionTimedOut, setIsSessionTimedOut] = useState<boolean>(false);

  const checkTimeout = useCallback(() => {
    if (typeof window === "undefined") return;
    const list = ProfileService.getAll();
    if (list.length === 0) {
      setModalView("create");
      setIsModalOpen(true);
      return;
    }

    const selectedAtStr = localStorage.getItem(PROFILE_SELECTED_AT_KEY);
    if (!selectedAtStr) {
      // Never selected or timestamp missing -> prompt selection
      setIsSessionTimedOut(true);
      setModalView("select");
      setIsModalOpen(true);
      return;
    }

    const selectedAt = Number(selectedAtStr);
    const now = Date.now();
    if (isNaN(selectedAt) || now - selectedAt > PROFILE_TIMEOUT_MS) {
      // 1 hour elapsed -> timeout!
      setIsSessionTimedOut(true);
      setModalView("select");
      setIsModalOpen(true);
    }
  }, []);

  const refreshProfiles = useCallback(() => {
    const list = ProfileService.getAll();
    setProfiles(list);
    const active = ProfileService.getActive();
    if (active) {
      setActiveIdState(active.id);
    } else if (list.length > 0) {
      ProfileService.setActive(list[0].id);
      setActiveIdState(list[0].id);
    } else {
      setActiveIdState("");
    }
  }, []);

  useEffect(() => {
    refreshProfiles();
    setIsLoaded(true);

    const list = ProfileService.getAll();
    if (list.length === 0) {
      setModalView("create");
      setIsModalOpen(true);
    } else {
      checkTimeout();
    }

    // Periodic check every 30 seconds for 1-hour timeout
    const timer = setInterval(() => {
      checkTimeout();
    }, 30000);

    // Check when user switches back to the tab or app
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkTimeout();
      }
    };
    const handleFocus = () => {
      checkTimeout();
    };

    const handleUpdate = () => refreshProfiles();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("fit_profiles_updated", handleUpdate);
    window.addEventListener("fit_profile_changed", handleUpdate);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("fit_profiles_updated", handleUpdate);
      window.removeEventListener("fit_profile_changed", handleUpdate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshProfiles, checkTimeout]);

  const setActiveProfileId = useCallback((id: string) => {
    ProfileService.setActive(id);
    setActiveIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(PROFILE_SELECTED_AT_KEY, Date.now().toString());
    }
    setIsSessionTimedOut(false);
    setIsModalOpen(false);
    refreshProfiles();
  }, [refreshProfiles]);

  const createProfile = useCallback((input: CreateProfileInput) => {
    const res = ProfileService.create(input);
    if (res.profile) {
      if (typeof window !== "undefined") {
        localStorage.setItem(PROFILE_SELECTED_AT_KEY, Date.now().toString());
      }
      setIsSessionTimedOut(false);
      setIsModalOpen(false);
      refreshProfiles();
    }
    return res;
  }, [refreshProfiles]);

  const deleteProfile = useCallback((id: string) => {
    ProfileService.delete(id);
    refreshProfiles();
  }, [refreshProfiles]);

  const openProfileModal = useCallback((view: "select" | "create" = "select") => {
    setModalView(view);
    setIsModalOpen(true);
  }, []);

  const closeProfileModal = useCallback(() => {
    // If there are no profiles, don't allow closing without creating one
    if (profiles.length === 0) return;
    setIsModalOpen(false);
  }, [profiles.length]);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0] || null;

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        activeProfileId,
        isLoaded,
        isModalOpen,
        modalView,
        isSessionTimedOut,
        setActiveProfileId,
        createProfile,
        deleteProfile,
        openProfileModal,
        closeProfileModal,
        refreshProfiles,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
