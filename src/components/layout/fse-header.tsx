"use client";

import Link from "next/link";
import { UserNav } from "./user-nav";

export function FseHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4">
      <Link href="/my-calls" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
          PB
        </div>
        <span className="font-semibold text-lg">POSBUDDY</span>
      </Link>
      <UserNav />
    </header>
  );
}
