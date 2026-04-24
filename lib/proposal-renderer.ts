interface ProposalLineItem {
  name: string;
  longDesc: string;
  amount: number;
}

export interface Proposal {
  _id: string;
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  date: string;
  total: number;
  lineItems: ProposalLineItem[];
  status?: string;
  signature?: string;
  signatureDate?: string | null;
}
