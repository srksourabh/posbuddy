"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/import/file-upload";
import { ColumnMapper } from "@/components/import/column-mapper";
import {
  fetchMappingsForCustomer,
  importCalls,
  saveMappings,
  type ColumnMapping,
} from "@/app/(backoffice)/import/actions";
import { CheckCircle, AlertCircle } from "lucide-react";

interface ImportWizardProps {
  customers: { customer_id: number; customer_name: string }[];
}

type Step = "select-customer" | "upload" | "map-columns" | "review" | "result";

export function ImportWizard({ customers }: ImportWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("select-customer");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [existingMappings, setExistingMappings] = useState<ColumnMapping[]>([]);
  const [result, setResult] = useState<{
    inserted: number;
    duplicates: number;
    errors: string[];
    total: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleCustomerSelect = (value: string) => {
    const id = Number(value);
    setCustomerId(id);
    // Fetch existing mappings for this customer
    fetchMappingsForCustomer(id).then((result) => {
      setExistingMappings(result.mappings);
      setStep("upload");
    });
  };

  const handleDataParsed = useCallback(
    (parsedHeaders: string[], parsedRows: Record<string, string>[]) => {
      setHeaders(parsedHeaders);
      setRows(parsedRows);
      setStep("map-columns");
    },
    []
  );

  const handleMappingsChange = useCallback((newMappings: ColumnMapping[]) => {
    setMappings(newMappings);
  }, []);

  const hasRequiredField = mappings.some(
    (m) => m.unifiedField === "call_ticket_number" && m.sourceColumn
  );

  const handleImport = () => {
    if (!customerId) return;
    setError(null);
    startTransition(async () => {
      // Save the mappings for future use
      await saveMappings(customerId, mappings);

      // Import the calls
      const importResult = await importCalls(customerId, rows, mappings);
      setResult(importResult);
      setStep("result");
    });
  };

  const customerName = customers.find(
    (c) => c.customer_id === customerId
  )?.customer_name;

  return (
    <div className="space-y-6">
      {/* Step: Select Customer */}
      {step === "select-customer" && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={handleCustomerSelect}>
              <SelectTrigger className="w-80">
                <SelectValue placeholder="Choose a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem
                    key={c.customer_id}
                    value={String(c.customer_id)}
                  >
                    {c.customer_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Step: Upload File */}
      {step === "upload" && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Step 2: Upload Excel File
              </h2>
              <p className="text-sm text-muted-foreground">
                Customer: {customerName}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setStep("select-customer")}
            >
              Back
            </Button>
          </div>
          <FileUpload onDataParsed={handleDataParsed} />
        </>
      )}

      {/* Step: Map Columns */}
      {step === "map-columns" && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Step 3: Map Columns
              </h2>
              <p className="text-sm text-muted-foreground">
                {rows.length} rows found. Map Excel columns to system fields.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button
                onClick={() => setStep("review")}
                disabled={!hasRequiredField}
              >
                Review
              </Button>
            </div>
          </div>
          <ColumnMapper
            excelHeaders={headers}
            existingMappings={existingMappings}
            onMappingsChange={handleMappingsChange}
          />
        </>
      )}

      {/* Step: Review */}
      {step === "review" && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Step 4: Review & Import</h2>
              <p className="text-sm text-muted-foreground">
                Customer: {customerName}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("map-columns")}
              >
                Back
              </Button>
              <Button onClick={handleImport} disabled={isPending}>
                {isPending ? "Importing..." : `Import ${rows.length} Calls`}
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="ml-2 font-medium">{customerName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Rows:</span>
                  <span className="ml-2 font-medium">{rows.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Mapped Fields:
                  </span>
                  <span className="ml-2 font-medium">
                    {mappings.length} of {headers.length}
                  </span>
                </div>
              </div>

              <div className="text-sm">
                <p className="font-medium mb-2">Column Mappings:</p>
                <ul className="space-y-1 text-muted-foreground">
                  {mappings.map((m) => (
                    <li key={m.unifiedField}>
                      {m.sourceColumn} → {m.unifiedField}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </>
      )}

      {/* Step: Result */}
      {step === "result" && result && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              {result.errors.length === 0 ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              )}
              <div>
                <h2 className="text-lg font-semibold">Import Complete</h2>
                <p className="text-sm text-muted-foreground">
                  {result.total} calls processed: {result.inserted} imported
                  {result.duplicates > 0 &&
                    `, ${result.duplicates} duplicates skipped`}
                  {result.errors.length > 0 &&
                    `, ${result.errors.length} error(s)`}
                </p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
                <p className="text-sm font-medium text-destructive mb-2">
                  Errors ({result.errors.length}):
                </p>
                <ul className="space-y-1 text-sm text-destructive/80">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {result.errors.length > 10 && (
                    <li>...and {result.errors.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => router.push("/calls")}>
                View Calls
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStep("select-customer");
                  setResult(null);
                  setRows([]);
                  setHeaders([]);
                  setMappings([]);
                }}
              >
                Import More
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
