import { FseCallsList } from "@/components/fse/fse-calls-list";
import { fetchMyAssignedCalls } from "./actions";

export default async function MyCallsPage() {
  const calls = await fetchMyAssignedCalls();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">My Calls</h1>
      <FseCallsList calls={calls} />
    </div>
  );
}
