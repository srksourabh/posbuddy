"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UNIFIED_FIELDS, type UnifiedFieldKey } from "@/lib/import/unified-fields";
import type { ColumnMapping } from "@/app/(backoffice)/import/actions";

interface ColumnMapperProps {
  excelHeaders: string[];
  existingMappings: ColumnMapping[];
  onMappingsChange: (mappings: ColumnMapping[]) => void;
}

/** Try to auto-match Excel headers to unified fields by name similarity */
function autoMatch(
  headers: string[],
  existing: ColumnMapping[]
): ColumnMapping[] {
  // If we have saved mappings for this customer, use them
  if (existing.length > 0) {
    return UNIFIED_FIELDS.map((field) => {
      const saved = existing.find((m) => m.unifiedField === field.key);
      if (saved && headers.includes(saved.sourceColumn)) {
        return saved;
      }
      // Try auto-match by name
      const match = headers.find(
        (h) => h.toLowerCase().replace(/[^a-z0-9]/g, "") ===
          field.key.toLowerCase().replace(/[^a-z0-9]/g, "")
      );
      return { sourceColumn: match ?? "", unifiedField: field.key };
    }).filter((m) => m.sourceColumn !== "");
  }

  // Auto-match by keyword similarity
  const keywords: Record<string, string[]> = {
    call_ticket_number: ["ticket", "sr no", "call id", "reference", "docket"],
    call_type: ["call type", "type", "service type"],
    call_creation_date: ["date", "creation date", "call date", "created"],
    merchant_name: ["merchant", "merchant name", "shop", "store"],
    mid: ["mid", "merchant id"],
    tid: ["tid", "terminal id", "terminal"],
    acquiring_bank: ["bank", "acquiring bank", "bank name"],
    contact_address: ["address", "location", "contact address"],
    city: ["city", "town"],
    district: ["district"],
    state: ["state", "province"],
    pincode: ["pincode", "pin", "zip", "postal"],
    contact_name: ["contact", "contact name", "person", "name"],
    contact_phone: ["phone", "mobile", "contact phone", "number"],
    device_model: ["device", "model", "device model", "terminal model"],
    problem_description: ["problem", "description", "issue", "complaint", "remark"],
  };

  return UNIFIED_FIELDS.map((field) => {
    const kws = keywords[field.key] ?? [];
    const match = headers.find((h) => {
      const lower = h.toLowerCase().trim();
      return kws.some(
        (kw) => lower === kw || lower.includes(kw)
      );
    });
    return { sourceColumn: match ?? "", unifiedField: field.key };
  }).filter((m) => m.sourceColumn !== "");
}

export function ColumnMapper({
  excelHeaders,
  existingMappings,
  onMappingsChange,
}: ColumnMapperProps) {
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);

  useEffect(() => {
    const auto = autoMatch(excelHeaders, existingMappings);
    setMappings(auto);
    onMappingsChange(auto);
    // Only run when headers change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excelHeaders]);

  const usedHeaders = new Set(mappings.map((m) => m.sourceColumn));

  const updateMapping = (unifiedField: UnifiedFieldKey, sourceColumn: string) => {
    const next = mappings.filter((m) => m.unifiedField !== unifiedField);
    if (sourceColumn && sourceColumn !== "none") {
      next.push({ sourceColumn, unifiedField });
    }
    setMappings(next);
    onMappingsChange(next);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>System Field</TableHead>
            <TableHead>Excel Column</TableHead>
            <TableHead className="w-20">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {UNIFIED_FIELDS.map((field) => {
            const current = mappings.find(
              (m) => m.unifiedField === field.key
            );
            return (
              <TableRow key={field.key}>
                <TableCell>
                  <span className="font-medium">{field.label}</span>
                  {field.required && (
                    <span className="ml-1 text-destructive">*</span>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={current?.sourceColumn ?? "none"}
                    onValueChange={(v) => updateMapping(field.key, v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60">
                      <SelectItem value="none">— Skip —</SelectItem>
                      {excelHeaders.map((header) => (
                        <SelectItem
                          key={header}
                          value={header}
                          disabled={
                            usedHeaders.has(header) &&
                            current?.sourceColumn !== header
                          }
                        >
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {current?.sourceColumn ? (
                    <Badge variant="secondary">Mapped</Badge>
                  ) : field.required ? (
                    <Badge variant="destructive">Required</Badge>
                  ) : (
                    <Badge variant="outline">Skipped</Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
