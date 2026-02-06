import { format } from "date-fns";

export function buildRepairSearchField(repairData: {
  repairNumber?: string;
  itemNumber?: string;
  description?: string;
  dateOut?: Date | string | null;
  returnDate?: Date | string | null;
  customerFirstName?: string;
  customerLastName?: string;
  vendor?: string;
}): string {
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, "MM/dd/yyyy");
    } catch {
      return '';
    }
  };

  return [
    repairData.repairNumber || '',
    repairData.itemNumber || '',
    repairData.description || '',
    formatDate(repairData.dateOut),
    formatDate(repairData.returnDate),
    repairData.customerFirstName || '',
    repairData.customerLastName || '',
    repairData.vendor || ''
  ].join(' ').trim();
}
