"use client";

import { useState, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  fetchMappingsForCustomer,
  saveMappings,
  type ColumnMapping,
} from "@/app/(backoffice)/import/actions";
import { Save, Upload } from "lucide-react";
import * as XLSX from "xlsx";

interface MappingsManagerProps {
  customers: { customer_id: number; customer_name: string }[];
}

export function MappingsManager({ customers }: MappingsManagerProps) {
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleCustomerSelect = async (value: string) => {
    const id = Number(value);
    setCustomerId(id);
    setLoading(true);
    setSaved(false);
    const result = await fetchMappingsForCustomer(id);
    setMappings(result.mappings);
    setLoading(false);
  };

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(
            sheet,
            { raw: false, defval: "" }
          );
          if (jsonData.length > 0) {
            setExcelHeaders(Object.keys(jsonData[0]));
          }
        } catch {
          // ignore parse errors
        }
      };
      reader.readAsArrayBuffer(file);
    },
    []
  );

  const usedHeaders = new Set(mappings.map((m) => m.sourceColumn));

  const updateMapping = (unifiedField: UnifiedFieldKey, sourceColumn: string) => {
    setMappings((prev) => {
      const next = prev.filter((m) => m.unifiedField !== unifiedField);
      if (sourceColumn && sourceColumn !== "none") {
        next.push({ sourceColumn, unifiedField });
      }
      return next;
    });
    setSaved(false);
  };

  const handleSave = () => {
    if (!customerId) return;
    startTransition(async () => {
      const filtered = mappings.filter((m) => m.sourceColumn.trim() !== "");
      await saveMappings(customerId, filtered);
      setSaved(true);
    });
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Select customer */}
      <div className="flex items-center gap-4 flex-wrap">
        <Select onValueChange={handleCustomerSelect}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-60">
            {customers.map((c) => (
              <SelectItem key={c.customer_id} value={String(c.customer_id)}>
                {c.customer_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {customerId && (
          <>
            <Button onClick={handleSave} disabled={isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isPending ? "Saving..." : "Save Mappings"}
            </Button>

            {saved && <Badge variant="secondary">Saved</Badge>}
          </>
        )}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {customerId && !loading && (
        <>
          {/* Step 2: Upload sample file to get column headers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Upload a Sample Excel File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a sample Excel file from this customer so you can pick
                columns from a dropdown instead of typing them manually.
              </p>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-6 transition-colors hover:border-muted-foreground/50 w-fit">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {fileName ?? "Choose file (.xlsx, .xls, .csv)"}
                </span>
                {excelHeaders.length > 0 && (
                  <Badge variant="secondary">
                    {excelHeaders.length} columns found
                  </Badge>
                )}
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </CardContent>
          </Card>

          {/* Step 3: Map columns */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Column Mapping Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {excelHeaders.length > 0
                  ? "Select which Excel column maps to each system field."
                  : "Upload a sample file above to enable dropdown selection, or type column names manually."}
              </p>
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
                            {excelHeaders.length > 0 ? (
                              <Select
                                value={current?.sourceColumn ?? "none"}
                                onValueChange={(v) =>
                                  updateMapping(field.key, v)
                                }
                              >
                                <SelectTrigger className="w-full max-w-xs">
                                  <SelectValue placeholder="Select column" />
                                </SelectTrigger>
                                <SelectContent
                                  position="popper"
                                  className="max-h-60"
                                >
                                  <SelectItem value="none">
                                    — Skip —
                                  </SelectItem>
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
                            ) : (
                              <input
                                type="text"
                                placeholder={`e.g., ${field.label}`}
                                value={current?.sourceColumn ?? ""}
                                onChange={(e) =>
                                  updateMapping(field.key, e.target.value)
                                }
                                className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              />
                            )}
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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
