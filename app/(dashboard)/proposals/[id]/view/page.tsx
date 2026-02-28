
import { ViewProposal } from "@/components/proposals/view-proposal";
import { fetchProposalById, fetchTenantById } from "@/lib/data";
import { notFound } from "next/navigation";
import { getTenantId } from "@/lib/auth-utils";
import { getImageHost } from "@/lib/utils/imageHost";

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  
  const proposal = await fetchProposalById(id);
  const tenantId = await getTenantId();
  const tenant = await fetchTenantById(tenantId);
  const imageHost = await getImageHost();

  
  if (!proposal) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <ViewProposal proposal={proposal} tenant={tenant} imageBaseUrl={imageHost} />
    </div>
  );
}
