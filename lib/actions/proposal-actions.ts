"use server"

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/dbConnect";
import { Proposal } from "@/lib/models/proposal";
import { format } from "date-fns";
import { getTenantObjectId } from "@/lib/tenant-utils";
import { getShortUser } from "@/lib/auth-utils";

export interface ProposalLineItem {
  name: string;
  longDesc?: string;
  amount: number;
}

export interface ProposalData {
  _id?: string;
  customerId?: string;
  customerNumber?: number;
  customerFirstName: string;
  customerLastName: string;
  customerEmail?: string;
  customerPhone?: string;
  date: string | Date;
  project?: string;
  total: number;
  lineItems: ProposalLineItem[];
  conditions?: string;
  status?: string;
}

export async function upsertProposal(data: ProposalData, id?: string) {
  try {
    await dbConnect();
    
    let proposalId: string;
    let proposalData: any;
    
    // Check if we're updating an existing proposal or creating a new one
    const isUpdate = id !== undefined;
    
    if (isUpdate) {
      // Update existing proposal
      proposalId = id;
      proposalData = {
        ...data,
        date: new Date(data.date)
      };
    } else {
      // Create new proposal — let MongoDB generate the ObjectId
      const tenantObjectId = await getTenantObjectId();
      proposalData = {
        ...data,
        tenantId: tenantObjectId,
        date: new Date(data.date)
      };
    }
    
    // 'Deleted' is system-owned (only deleteProposal writes it) - a request
    // payload must never be able to set or clear the soft-delete marker.
    if (proposalData.status === 'Deleted') {
      delete proposalData.status;
    }

    // Calculate total from line items
    proposalData.total = proposalData.lineItems.reduce((sum: number, item: ProposalLineItem) => sum + (item.amount || 0), 0);
    
    // Update search field
    proposalData.search = buildSearchField(proposalData);
    
    if (isUpdate) {
      // Update existing proposal
      const tenantObjectId = await getTenantObjectId();
      const updated = await Proposal.findOneAndUpdate(
        { _id: id, tenantId: tenantObjectId, status: { $ne: 'Deleted' } },
        proposalData
      );
      if (!updated) {
        return { success: false, error: 'Proposal not found' };
      }
      proposalId = id;
    } else {
      // Create new proposal
      const proposal = new Proposal(proposalData);
      await proposal.save();
      proposalId = proposal._id.toString();
    }
    
    revalidatePath('/proposals');
    return { success: true, proposalId };
  } catch (error) {
    console.error(`Error ${id ? 'updating' : 'creating'} proposal:`, error);
    return { 
      success: false, 
      error: `Failed to ${id ? 'update' : 'create'} proposal${id ? ': ' + (error instanceof Error ? error.message : String(error)) : ''}` 
    };
  }
}

/**
 * Soft-delete a proposal: marks it 'Deleted', which hides it from the
 * proposal list, detail/edit pages, PDF and email routes, the time-entry
 * project dropdown, and the e-sign flow. The document is kept for audit.
 */
export async function deleteProposal(id: string) {
  try {
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();
    const user = await getShortUser();

    const result = await Proposal.updateOne(
      { _id: id, tenantId: tenantObjectId, status: { $ne: 'Deleted' } },
      {
        $set: {
          status: 'Deleted',
          deletedAt: new Date(),
          deletedBy: user,
        },
      }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: 'Proposal not found', code: 'not_found' as const };
    }

    revalidatePath('/proposals');
    revalidatePath('/time');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error deleting proposal:', error);
    return {
      success: false,
      error: `Failed to delete proposal: ${error instanceof Error ? error.message : String(error)}`,
      code: 'error' as const,
    };
  }
}

function buildSearchField(doc: ProposalData) {
  var search = "";
  if (doc._id != null) {
    search += doc._id.toString() + " ";
  }

  const formattedDate = format(doc.date, 'yyyy-MM-dd');

  search += doc.customerFirstName + " " + doc.customerLastName + " " + formattedDate + " ";

  if (doc.project) {
    search += doc.project + " ";
  }

  if (doc.lineItems != null) {
    for (var i = 0; i < doc.lineItems.length; i++) {
      if (doc.lineItems[i] != null) {
        search += " " + doc.lineItems[i].name;
      }
    }
  }
  return search;
}
