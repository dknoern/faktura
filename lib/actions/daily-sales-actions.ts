"use server";

import { getDailySales } from "@/lib/reports";

export async function fetchDailySalesData(selectedDate: Date) {
  // Ensure we're working with a clean date at start of day in local timezone
  const localDate = new Date(selectedDate);
  localDate.setHours(0, 0, 0, 0);
  
  const year = localDate.getFullYear();
  const month = localDate.getMonth() + 1; // getMonth() returns 0-11, but getDailySales expects 1-12
  const day = localDate.getDate();

  try {
    const invoices = await getDailySales(year, month, day);
    return JSON.parse(JSON.stringify(invoices)); // Serialize for client
  } catch (error) {
    console.error('Error fetching daily sales data:', error);
    throw error;
  }
}
