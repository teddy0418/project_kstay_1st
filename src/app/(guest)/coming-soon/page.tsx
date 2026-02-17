import EmptyState from "@/components/ui/EmptyState";

export default function ComingSoonPage() {
  return (
    <EmptyState
      title="Page coming soon"
      description="This feature is not available yet. We're preparing it."
      primaryHref="/"
      primaryLabel="Back to Home"
      secondaryHref="/help"
      secondaryLabel="Help Center"
    />
  );
}
