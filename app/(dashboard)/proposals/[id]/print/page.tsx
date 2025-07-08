import { fetchProposalById, fetchDefaultTenant } from "@/lib/data";
import { generateEmailHtml } from "@/lib/proposal-renderer";
import { getImageHost } from "@/lib/utils/imageHost";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  
  const proposal = await fetchProposalById(parseInt(id));
  
  if (!proposal) {
    notFound();
  }

  const tenant = await fetchDefaultTenant();
  const imageHost = await getImageHost();
  
  // Serialize the data to handle Date objects and ObjectIds
  const serializedProposal = JSON.parse(JSON.stringify(proposal));
  const serializedTenant = JSON.parse(JSON.stringify(tenant));
  
  const htmlContent = generateEmailHtml(serializedProposal, serializedTenant, imageHost);
  
  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
}
