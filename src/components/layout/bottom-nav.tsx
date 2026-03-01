"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, MapPin, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

const fseNavItems = [
  { title: "My Calls", href: "/my-calls", icon: Phone },
  { title: "Active Visit", href: "/active-visit", icon: MapPin },
  { title: "History", href: "/history", icon: Clock },
  { title: "Profile", href: "/profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-16 items-center justify-around">
        {fseNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] min-h-[44px] rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className={cn("text-xs", isActive && "font-semibold")}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
