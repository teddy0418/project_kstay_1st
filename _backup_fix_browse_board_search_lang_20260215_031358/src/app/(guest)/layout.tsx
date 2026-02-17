import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="pb-24">{children}</main>
      <BottomNav />
    </>
  );
}
