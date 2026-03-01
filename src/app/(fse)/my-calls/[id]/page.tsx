import { notFound } from "next/navigation";
import { fetchCallForFse } from "../actions";
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

  return <FseCallDetail call={call} />;
}
