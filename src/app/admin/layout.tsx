import Link from "next/link";
import Container from "@/components/layout/Container";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="border-b border-neutral-200 bg-white">
        <Container className="py-4 flex items-center justify-between">
          <div className="font-semibold">KSTAY Admin</div>
          <div className="flex gap-3 text-sm">
            <Link href="/" className="text-neutral-600 hover:text-neutral-900">
              Guest
            </Link>
            <Link href="/admin" className="text-neutral-600 hover:text-neutral-900">
              Summary
            </Link>
            <Link href="/admin/approvals" className="text-neutral-600 hover:text-neutral-900">
              Approvals
            </Link>
            <Link href="/admin/settlements" className="text-neutral-600 hover:text-neutral-900">
              Settlements
            </Link>
          </div>
        </Container>
      </div>
      <Container className="py-8">{children}</Container>
    </div>
  );
}
