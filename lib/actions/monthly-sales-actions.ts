"use server";

import { getMonthlySales } from "@/lib/reports";

export async function fetchMonthlySalesData(year: number, month: number) {
  try {
    const invoices = await getMonthlySales(year, month);
    return JSON.parse(JSON.stringify(invoices)); // Serialize for client
  } catch (error) {
    console.error('Error fetching monthly sales data:', error);
    throw error;
  }
}
