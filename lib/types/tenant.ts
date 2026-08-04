export interface TenantFeatures {
  products?: boolean;
  customers?: boolean;
  proposals?: boolean;
  invoices?: boolean;
  returns?: boolean;
  repairs?: boolean;
  wanted?: boolean;
  loginitems?: boolean;
  logoutitems?: boolean;
  reports?: boolean;
  payments?: boolean;
}

export interface Tenant {
  _id: string;
  features?: TenantFeatures;
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
  requiredData?: {
    customerPhone?: boolean;
    customerEmail?: boolean;
    customerAddress?: boolean;
    salesPerson?: boolean;
  };
}
