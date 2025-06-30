"use server";

import { getDailySales } from "@/lib/reports";

export async function fetchDailySalesData(selectedDate: Date) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1; // getMonth() returns 0-11, but getDailySales expects 1-12
  const day = selectedDate.getDate();

  try {
    const invoices = await getDailySales(year, month, day);
    return JSON.parse(JSON.stringify(invoices)); // Serialize for client
  } catch (error) {
    console.error('Error fetching daily sales data:', error);
    throw error;
  }
}
