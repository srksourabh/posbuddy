import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone } from "lucide-react";

export default function MyCallsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Calls</h1>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <Phone className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Assigned Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No calls assigned yet. Calls assigned to you will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
