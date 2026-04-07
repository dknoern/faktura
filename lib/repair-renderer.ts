// Repair renderer utility
// Generates plain HTML for repair content that can be used in both email and web views

export interface Repair {
  _id: string;
  repairNumber: string;
  itemNumber: string;
  description: string;
  dateOut: string | null;
  customerApprovedDate: string | null;
  returnDate: string | null;
  customerFirstName: string;
  customerLastName: string;
  vendor: string;
  repairCost: number;
  repairIssues: string;
  repairNotes: string;
}

export type { Tenant } from '@/lib/types/tenant';

// Format currency values - using consistent format to avoid hydration issues
export const formatCurrency = (value: number | null | undefined = 0) => {
  const formatted = (value || 0).toFixed(2);
  return `$${formatted}`;
};

// Format date values - using consistent format to avoid hydration issues
export const formatDate = (dateString: string | null) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Get timezone from environment variable, default to Central timezone
  const timeZone = process.env.TIMEZONE || 'America/Chicago';
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone,
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  };
  
  return date.toLocaleDateString('en-US', options);
};

