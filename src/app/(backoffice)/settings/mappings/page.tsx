import { MappingsManager } from "@/components/import/mappings-manager";
import { fetchCustomers } from "@/app/(backoffice)/calls/actions";

export default async function MappingsPage() {
  const customers = await fetchCustomers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Column Mappings</h1>
        <p className="text-muted-foreground">
          Configure how each customer&apos;s Excel columns map to system fields.
        </p>
      </div>

      <MappingsManager customers={customers} />
    </div>
  );
}
