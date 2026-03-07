"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/ui/AuthProvider";
import OnboardingModal from "@/components/ui/OnboardingModal";
import { apiClient } from "@/lib/api/client";

type ProfileData = {
  name?: string;
  email?: string;
  phone?: string;
  nationality?: string;
  profileCompletedAt?: string | null;
};

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { isAuthed } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [checked, setChecked] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiClient.get<ProfileData>("/api/user/profile");
      setProfile(data);
      // 소셜 로그인 후 온보딩 없이 바로 이용. 예약자 정보는 체크아웃에서 수집·계정 반영
    } catch {
      setProfile(null);
    } finally {
      setChecked(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthed) {
      setChecked(true);
      setProfile(null);
      setShowModal(false);
      return;
    }
    fetchProfile();
  }, [isAuthed, fetchProfile]);

  const handleComplete = useCallback(() => {
    setShowModal(false);
    fetchProfile();
  }, [fetchProfile]);

  const handleClose = useCallback(() => {
    setShowModal(false);
  }, []);

  return (
    <>
      {children}
      {showModal && profile && (
        <OnboardingModal
          open={showModal}
          onClose={handleClose}
          onComplete={handleComplete}
          initialData={{
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            nationality: profile.nationality,
          }}
        />
      )}
    </>
  );
}
