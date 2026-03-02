import { fetchCustomersForTemplates } from "./actions";
import { ClosureTemplateManager } from "@/components/master/closure-template-manager";

export default async function ClosureTemplatesPage() {
  const customers = await fetchCustomersForTemplates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Closure Templates
        </h1>
        <p className="text-muted-foreground">
          Configure which fields FSEs must fill when closing a service call for
          each customer.
        </p>
      </div>

      <ClosureTemplateManager customers={customers} />
    </div>
  );
}
