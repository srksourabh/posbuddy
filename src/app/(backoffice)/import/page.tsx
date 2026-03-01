import { ImportWizard } from "@/components/import/import-wizard";
import { fetchCustomers } from "@/app/(backoffice)/calls/actions";

export default async function ImportPage() {
  const customers = await fetchCustomers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Calls</h1>
        <p className="text-muted-foreground">
          Upload an Excel file with call data and map columns to system fields.
        </p>
      </div>

      <ImportWizard customers={customers} />
    </div>
  );
}
