"use client";

import { Phone, MapPin } from "lucide-react";
import { getInitials } from "@/lib/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TeamFSE } from "@/app/(backoffice)/assign/actions";
import type { Database } from "@/lib/types/database";

type StaffRow = Database["public"]["Tables"]["pos_staff"]["Row"];

interface TeamViewProps {
  fses: TeamFSE[];
  currentUser: StaffRow;
}

export function TeamView({ fses, currentUser }: TeamViewProps) {
  return (
    <div className="space-y-6">
      {/* Current user card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">You</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
              {getInitials(currentUser.full_name)}
            </div>
            <div>
              <p className="font-semibold">
                {currentUser.full_name ?? "Unknown"}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentUser.designation} — {currentUser.department}
              </p>
              <p className="text-xs text-muted-foreground">
                {[currentUser.city, currentUser.state]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Team Members ({fses.length})
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Field engineers reporting to you
          </p>
        </CardHeader>
        <CardContent>
          {fses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No field engineers in your team yet.
            </p>
          ) : (
            <div className="space-y-3">
              {fses.map((fse) => (
                <div
                  key={fse.staff_id}
                  className="flex items-center gap-3 border rounded-lg p-4"
                >
                  <div className="relative">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {getInitials(fse.full_name)}
                    </div>
                    {fse.in_progress_calls > 0 && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">
                        {fse.full_name ?? "Unknown"}
                      </p>
                      {fse.in_progress_calls > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-green-100 text-green-700"
                        >
                          On-site
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {fse.designation}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {fse.city && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {fse.city}, {fse.state}
                        </span>
                      )}
                      {fse.phone && (
                        <a
                          href={`tel:${fse.phone}`}
                          className="flex items-center gap-1 text-xs text-primary"
                        >
                          <Phone className="h-3 w-3" />
                          {fse.phone}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4 text-center">
                    <div>
                      <div
                        className={`text-lg font-bold ${
                          fse.open_calls > 3
                            ? "text-destructive"
                            : fse.open_calls > 1
                              ? "text-yellow-500"
                              : "text-green-500"
                        }`}
                      >
                        {fse.open_calls}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        open
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">
                        {fse.in_progress_calls}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        live
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
