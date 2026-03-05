"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { CALL_STATUSES } from "@/lib/constants";

const STATUSES = [
  { value: "all", label: "All Statuses" },
  ...CALL_STATUSES.map((s) => ({ value: s, label: s })),
];

interface CallsFiltersProps {
  customers: { customer_id: number; customer_name: string }[];
}

export function CallsFilters({ customers }: CallsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const status = searchParams.get("status") ?? "all";
  const customerId = searchParams.get("customer") ?? "all";
  const search = searchParams.get("search") ?? "";

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      // Reset to page 1 when filters change
      params.delete("page");
      startTransition(() => {
        router.push(`/calls?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const hasFilters = status !== "all" || customerId !== "all" || search !== "";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Search ticket, merchant, MID, TID..."
        className="w-64"
        defaultValue={search}
        onChange={(e) => {
          const value = e.target.value;
          // Debounce: only update after user stops typing
          const timeout = setTimeout(() => updateParams({ search: value }), 400);
          return () => clearTimeout(timeout);
        }}
      />

      <Select
        value={status}
        onValueChange={(v) => updateParams({ status: v })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={customerId}
        onValueChange={(v) => updateParams({ customer: v })}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Customer" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Customers</SelectItem>
          {customers.map((c) => (
            <SelectItem key={c.customer_id} value={String(c.customer_id)}>
              {c.customer_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            startTransition(() => {
              router.push("/calls");
            });
          }}
        >
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
