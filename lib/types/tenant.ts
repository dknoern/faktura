export interface Tenant {
  _id: string;
  name?: string;
  nameLong?: string;
  email?: string;
  phone?: string;
  fax?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  website?: string;
  warranty?: string;
  returnPolicy?: string;
  bankWireTransferInstructions?: string;
  proposalTerms?: string;
  repairConfirmationText?: string;
  stripe?: {
    enabled?: boolean;
    secretKeyLast4?: string;
    publishableKey?: string;
    updatedAt?: string | Date;
  };
  avatax?: {
    enabled?: boolean;
    username?: string;
    passwordLast4?: string;
    environment?: 'sandbox' | 'production';
    companyCode?: string;
    updatedAt?: string | Date;
  };
}
