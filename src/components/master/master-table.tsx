"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export interface MasterColumn {
  key: string;
  label: string;
  type?: "boolean" | "text";
}

interface MasterTableProps {
  columns: MasterColumn[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: Record<string, any>[];
  idKey: string;
}

export function MasterTable({ columns, rows, idKey }: MasterTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No records found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row[idKey]}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.type === "boolean" ? (
                      <Badge variant={row[col.key] ? "default" : "secondary"}>
                        {row[col.key] ? "Yes" : "No"}
                      </Badge>
                    ) : (
                      String(row[col.key] ?? "—")
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
