import { FseHeader } from "@/components/layout/fse-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { requireFSE } from "@/lib/auth/session";

export default async function FseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireFSE();

  return (
    <div className="flex min-h-dvh flex-col">
      <FseHeader />
      <main className="flex-1 px-4 py-4 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
