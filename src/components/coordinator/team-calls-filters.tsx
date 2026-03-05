"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCallback } from "react";
import { CALL_STATUSES } from "@/lib/constants";

interface TeamCallsFiltersProps {
  customers: { customer_id: number; customer_name: string }[];
  fses: { staff_id: number; full_name: string }[];
}

export function TeamCallsFilters({ customers, fses }: TeamCallsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-3">
      <Input
        placeholder="Search ticket, merchant..."
        className="w-64"
        defaultValue={searchParams.get("search") ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          // Debounce-like: update on blur or enter
          if (val.length === 0 || val.length >= 2) {
            updateParam("search", val);
          }
        }}
      />
      <Select
        defaultValue={searchParams.get("customer") ?? "all"}
        onValueChange={(v) => updateParam("customer", v)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Customers" />
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
      <Select
        defaultValue={searchParams.get("status") ?? "all"}
        onValueChange={(v) => updateParam("status", v)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {CALL_STATUSES.map(
            (s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
      <Select
        defaultValue={searchParams.get("fse") ?? "all"}
        onValueChange={(v) => updateParam("fse", v)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All My FSEs" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All My FSEs</SelectItem>
          {fses.map((f) => (
            <SelectItem key={f.staff_id} value={String(f.staff_id)}>
              {f.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
