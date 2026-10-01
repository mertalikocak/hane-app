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
  const [isSessionTimedOut] = useState<boolean>(false);

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
      // Henüz sistemde hiç profil yoksa oluşturma modalı aç
      setModalView("create");
      setIsModalOpen(true);
    }

    const handleUpdate = () => refreshProfiles();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("fit_profiles_updated", handleUpdate);
    window.addEventListener("fit_profile_changed", handleUpdate);

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("fit_profiles_updated", handleUpdate);
      window.removeEventListener("fit_profile_changed", handleUpdate);
    };
  }, [refreshProfiles]);

  const setActiveProfileId = useCallback((id: string) => {
    ProfileService.setActive(id);
    setActiveIdState(id);
    setIsModalOpen(false);
    refreshProfiles();
  }, [refreshProfiles]);

  const createProfile = useCallback((input: CreateProfileInput) => {
    const res = ProfileService.create(input);
    if (res.profile) {
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
