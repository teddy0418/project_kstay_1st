import ListingViewTracker from "@/features/listings/components/ListingViewTracker";

export default function ListingDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ListingViewTracker />
      {children}
    </>
  );
}
