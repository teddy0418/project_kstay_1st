import EmptyState from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <EmptyState
      title="This page is being prepared"
      description="We're working on it. Please go back to the home page for now."
      primaryHref="/"
      primaryLabel="Back to Home"
    />
  );
}
