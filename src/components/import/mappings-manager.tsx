"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Save } from "lucide-react";

interface MappingsManagerProps {
  customers: { customer_id: number; customer_name: string }[];
}

export function MappingsManager({ customers }: MappingsManagerProps) {
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleCustomerSelect = async (value: string) => {
    const id = Number(value);
    setCustomerId(id);
    setLoading(true);
    setSaved(false);
    const result = await fetchMappingsForCustomer(id);
    setMappings(result.mappings);
    setLoading(false);
  };

  const updateSourceColumn = (
    unifiedField: UnifiedFieldKey,
    sourceColumn: string
  ) => {
    setMappings((prev) => {
      const existing = prev.find((m) => m.unifiedField === unifiedField);
      if (existing) {
        return prev.map((m) =>
          m.unifiedField === unifiedField
            ? { ...m, sourceColumn }
            : m
        );
      }
      return [...prev, { sourceColumn, unifiedField }];
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
      <div className="flex items-center gap-4">
        <Select onValueChange={handleCustomerSelect}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((c) => (
              <SelectItem key={c.customer_id} value={String(c.customer_id)}>
                {c.customer_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {customerId && (
          <Button onClick={handleSave} disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            {isPending ? "Saving..." : "Save Mappings"}
          </Button>
        )}

        {saved && (
          <Badge variant="secondary">Saved</Badge>
        )}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {customerId && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Column Mapping Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Enter the exact Excel column header name for each system field.
              These mappings will be used as defaults when importing files for
              this customer.
            </p>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>System Field</TableHead>
                    <TableHead>Excel Column Name</TableHead>
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
                          <Input
                            placeholder={`e.g., ${field.label}`}
                            value={current?.sourceColumn ?? ""}
                            onChange={(e) =>
                              updateSourceColumn(field.key, e.target.value)
                            }
                            className="max-w-xs"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
