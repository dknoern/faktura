export interface Out {
  id?: string;
  _id?: string;
  date: Date | string;
  sentTo: string;
  description: string;
  comments?: string;
  user?: string;
  signature?: string;
  signatureDate?: Date | string;
  signatureUser?: string;
}

export type { Tenant } from '@/lib/types/tenant';
