"use client";

import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import * as XLSX from "xlsx";

interface FileUploadProps {
  onDataParsed: (headers: string[], rows: Record<string, string>[]) => void;
}

export function FileUpload({ onDataParsed }: FileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];

          const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(
            sheet,
            { raw: false, defval: "" }
          );

          if (jsonData.length === 0) {
            setError("The file is empty or has no data rows.");
            return;
          }

          const headers = Object.keys(jsonData[0]);
          onDataParsed(headers, jsonData);
        } catch {
          setError("Failed to parse the file. Please check the format.");
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [onDataParsed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <Card>
      <CardContent className="p-6">
        <label
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-10 transition-colors hover:border-muted-foreground/50"
        >
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">
              {fileName ?? "Drop Excel file here or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports .xlsx, .xls, .csv
            </p>
          </div>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
        {error && (
          <p className="mt-3 text-sm text-destructive text-center">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
