import { notFound } from "next/navigation";
import { fetchCallById } from "../actions";
import { CallDetail } from "@/components/calls/call-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CallDetailPage({ params }: PageProps) {
  const { id } = await params;
  const callId = Number(id);

  if (isNaN(callId)) notFound();

  const call = await fetchCallById(callId);
  if (!call) notFound();

  return <CallDetail call={call} />;
}
