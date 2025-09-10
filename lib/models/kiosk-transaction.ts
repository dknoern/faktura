import { z } from "zod";

// Repair item for kiosk transaction
export const kioskRepairSchema = z.object({
  id: z.string(),
  brand: z.string(),
  material: z.string(),
  referenceNumber: z.string().optional(),
  repairOptions: z.object({
    service: z.boolean(),
    polish: z.boolean(),
    batteryChange: z.boolean(),
    other: z.boolean(),
  }),
  description: z.string().optional(),
});

// Offer item for kiosk transaction
export const kioskOfferSchema = z.object({
  id: z.string(),
  brand: z.string(),
  model: z.string(),
  material: z.string(),
  condition: z.string(),
  yearPurchased: z.string().optional(),
  originalPrice: z.string().optional(),
  description: z.string().optional(),
});

// Customer data for kiosk transaction
export const kioskCustomerSchema = z.object({
  _id: z.string().optional(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string(),
  company: z.string().optional(),
});

// Complete kiosk transaction
export const kioskTransactionSchema = z.object({
  customer: kioskCustomerSchema,
  repairs: z.array(kioskRepairSchema),
  offers: z.array(kioskOfferSchema),
  images: z.array(z.string()), // Base64 encoded images or file paths
  signature: z.string(),
  signatureDate: z.date().optional(),
  receivedBy: z.string(),
  comments: z.string().optional(),
  createdAt: z.date(),
});

export type KioskRepair = z.infer<typeof kioskRepairSchema>;
export type KioskOffer = z.infer<typeof kioskOfferSchema>;
export type KioskCustomer = z.infer<typeof kioskCustomerSchema>;
export type KioskTransaction = z.infer<typeof kioskTransactionSchema>;
