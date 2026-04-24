import { EsignClient } from "@/components/esign/esign-client";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function EsignPage({ params }: PageProps) {
  const { token } = await params;

  return <EsignClient token={token} />;
}
