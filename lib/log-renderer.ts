export interface LineItem {
  itemNumber?: string;
  name?: string;
  repairNumber?: string;
  repairCost?: number;
  productId?: string;
  repairId?: string;
}

export interface Log {
  id?: string;
  _id?: string;
  date: Date | string;
  receivedFrom: string;
  comments?: string;
  user?: string;
  customerName?: string;
  vendor?: string;
  search?: string;
  lineItems?: LineItem[];
  signature?: string;
  signatureDate?: Date | string;
}

export type { Tenant } from '@/lib/types/tenant';
