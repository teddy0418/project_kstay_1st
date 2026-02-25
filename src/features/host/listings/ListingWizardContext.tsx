"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "@/lib/api/client";

export type WizardListing = {
  id: string;
  status: string;
  title: string | null;
  titleKo: string | null;
  titleJa: string | null;
  titleZh: string | null;
  city: string;
  area: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  location?: string | null;
  basePriceKrw: number;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInGuideMessage?: string | null;
  houseRulesMessage?: string | null;
  hostBio: string | null;
  hostBioKo: string | null;
  hostBioJa: string | null;
  hostBioZh: string | null;
  amenities: string[];
  propertyType?: string | null;
  maxGuests?: number | null;
  country?: string | null;
  stateProvince?: string | null;
  cityDistrict?: string | null;
  roadAddress?: string | null;
  detailedAddress?: string | null;
  zipCode?: string | null;
  weekendSurchargePct?: number | null;
  peakSurchargePct?: number | null;
  nonRefundableSpecialEnabled?: boolean;
  freeCancellationDays?: number | null;
  businessRegistrationDocUrl?: string | null;
  lodgingReportDocUrl?: string | null;
  images: { id: string; url: string; sortOrder: number }[];
};

type PatchPayload = Record<string, unknown>;

type ContextValue = {
  listing: WizardListing | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  patch: (payload: PatchPayload) => Promise<void>;
  setListing: (next: WizardListing | null) => void;
  isLocked: boolean;
  dirty: boolean;
  setDirty: (v: boolean) => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
  performSaveRef: React.MutableRefObject<(() => Promise<void>) | null>;
  performSave: () => Promise<void>;
};

const ListingWizardContext = createContext<ContextValue | null>(null);

export function useListingWizard(): ContextValue {
  const ctx = useContext(ListingWizardContext);
  if (!ctx) throw new Error("useListingWizard must be used within ListingWizardProvider");
  return ctx;
}

export function ListingWizardProvider({
  listingId,
  children,
}: {
  listingId: string;
  children: React.ReactNode;
}) {
  const [listing, setListing] = useState<WizardListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const performSaveRef = useRef<(() => Promise<void>) | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<WizardListing>(`/api/host/listings/${listingId}`);
      if (!data?.id) {
        setError("숙소 정보를 불러올 수 없습니다.");
        setListing(null);
        return;
      }
      const imgs = (data?.images ?? []).slice().sort((a: { sortOrder: number }, b: { sortOrder: number }) => a.sortOrder - b.sortOrder);
      setListing({
        ...data,
        images: imgs,
        amenities: Array.isArray(data?.amenities) ? data.amenities : [],
      } as WizardListing);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load listing");
      setListing(null);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  const patch = useCallback(
    async (payload: PatchPayload) => {
      const clean: PatchPayload = {};
      Object.entries(payload).forEach(([k, v]) => {
        if (k === "amenities" && Array.isArray(v)) {
          clean[k] = v;
        } else if (v === "" || (Array.isArray(v) && v.length === 0)) {
          clean[k] = undefined;
        } else {
          clean[k] = v;
        }
      });
      const updated = await apiClient.patch<Partial<WizardListing>>(`/api/host/listings/${listingId}`, clean);
      if (listing) {
        setListing({ ...listing, ...updated, images: listing.images, amenities: (updated as { amenities?: string[] }).amenities ?? listing.amenities });
      } else {
        await reload();
      }
    },
    [listingId, listing, reload]
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  const performSave = useCallback(async () => {
    const fn = performSaveRef.current;
    if (!fn) return;
    setSaving(true);
    try {
      await fn();
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      listing,
      loading,
      error,
      reload,
      patch,
      setListing,
      isLocked: listing?.status !== "DRAFT",
      dirty,
      setDirty,
      saving,
      setSaving,
      performSaveRef,
      performSave,
    }),
    [listing, loading, error, reload, patch, dirty, saving, performSave]
  );

  return (
    <ListingWizardContext.Provider value={value}>
      {children}
    </ListingWizardContext.Provider>
  );
}
