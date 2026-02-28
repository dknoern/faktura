"use server"

import { revalidatePath } from "next/cache";
import dbConnect from "./dbConnect";
import { Proposal } from "./models/proposal";
import { format } from "date-fns";
import { getTenantObjectId } from "./tenant-utils";

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
  date: string | Date;
  total: number;
  lineItems: ProposalLineItem[];
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
    
    // Calculate total from line items
    proposalData.total = proposalData.lineItems.reduce((sum: number, item: ProposalLineItem) => sum + (item.amount || 0), 0);
    
    // Update search field
    proposalData.search = buildSearchField(proposalData);
    
    if (isUpdate) {
      // Update existing proposal
      const tenantObjectId = await getTenantObjectId();
      await Proposal.findOneAndUpdate({ _id: id, tenantId: tenantObjectId }, proposalData);
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

function buildSearchField(doc: ProposalData) {
  var search = "";
  if (doc._id != null) {
    search += doc._id.toString() + " ";
  }

  const formattedDate = format(doc.date, 'yyyy-MM-dd');

  search += doc.customerFirstName + " " + doc.customerLastName + " " + formattedDate + " ";

  if (doc.lineItems != null) {
    for (var i = 0; i < doc.lineItems.length; i++) {
      if (doc.lineItems[i] != null) {
        search += " " + doc.lineItems[i].name;
      }
    }
  }
  return search;
}
