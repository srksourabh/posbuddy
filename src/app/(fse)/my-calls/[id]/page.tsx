import { notFound } from "next/navigation";
import { fetchCallForFse, fetchClosureTemplate, fetchVisitStartTime } from "../actions";
import { FseCallDetail } from "@/components/fse/fse-call-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FseCallDetailPage({ params }: PageProps) {
  const { id } = await params;
  const callId = Number(id);

  if (isNaN(callId)) notFound();

  const call = await fetchCallForFse(callId);
  if (!call) notFound();

  const [closureTemplate, visitStartTime] = await Promise.all([
    fetchClosureTemplate(call.customer_id),
    call.call_status === "In Progress"
      ? fetchVisitStartTime(callId)
      : Promise.resolve(null),
  ]);

  return (
    <FseCallDetail
      call={call}
      closureTemplate={closureTemplate}
      visitStartTime={visitStartTime}
    />
  );
}
