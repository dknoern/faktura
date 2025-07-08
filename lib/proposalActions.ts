"use server"

import { revalidatePath } from "next/cache";
import dbConnect from "./dbConnect";
import { Proposal } from "./models/proposal";
import { Counter } from "./models/counter";
import { format } from "date-fns";

export interface ProposalLineItem {
  name: string;
  longDesc?: string;
  amount: number;
}

export interface ProposalData {
  _id?: number;
  customerId?: number;
  customerFirstName: string;
  customerLastName: string;
  date: string | Date;
  total: number;
  lineItems: ProposalLineItem[];
  status?: string;
}

export async function upsertProposal(data: ProposalData, id?: number) {
  try {
    await dbConnect();
    
    let proposalId: number;
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
      // Create new proposal
      // Generate a new proposal number using Counter
      const newProposalNumber = await Counter.findByIdAndUpdate(
        { _id: 'proposalNumber' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      
      proposalId = newProposalNumber.seq;
      proposalData = {
        ...data,
        _id: proposalId,
        date: new Date(data.date)
      };
    }
    
    // Calculate total from line items
    proposalData.total = proposalData.lineItems.reduce((sum: number, item: ProposalLineItem) => sum + (item.amount || 0), 0);
    
    // Update search field
    proposalData.search = buildSearchField(proposalData);
    
    if (isUpdate) {
      // Update existing proposal
      await Proposal.findByIdAndUpdate(id, proposalData);
    } else {
      // Create new proposal
      const proposal = new Proposal(proposalData);
      await proposal.save();
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
