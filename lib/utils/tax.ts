import { Invoice } from "../invoice-renderer";

import * as Enums from 'avatax/lib/enums/index';
import { getAvataxForTenant } from "@/lib/avatax/client";
import { loadTenantAvataxConfig, isFullyConfigured, DEFAULT_COMPANY_CODE } from "@/lib/avatax/config";

/**
 * Calculate tax for an invoice using Avatax (per-tenant credentials).
 * Returns 0 immediately if the tenant has not opted in to AvaTax.
 */
export async function calcTax(invoice: Invoice, tenantId: string): Promise<number> {
  console.log('Calculating tax for invoice', invoice._id);

  // Gate everything on per-tenant opt-in.
  const config = await loadTenantAvataxConfig(tenantId);
  if (!config?.enabled) {
    return 0;
  }

  // Existing zero-cases: preserved exactly.
  if (!invoice.shipState) {
    console.log("State not specified, will not calculate tax");
    return 0;
  }
  if (invoice.taxExempt) {
    console.log("Tax exempt, no tax");
    return 0;
  }
  if (invoice.methodOfSale == 'Ebay') {
    console.log("ebay, no tax");
    return 0;
  }
  if (invoice.shipState === 'TX') {
    // Manual Texas tax — kept even when AvaTax is enabled.
    const totalTax = invoice.subtotal * 0.0825;
    console.log("Manually calculating TX tax:", totalTax);
    return totalTax;
  }

  if (!isFullyConfigured(config)) {
    console.warn(`[avatax] tenant ${tenantId}: enabled but credentials incomplete; returning 0`);
    return 0;
  }

  const clientCtx = await getAvataxForTenant(tenantId);
  if (!clientCtx) {
    console.warn(`[avatax] tenant ${tenantId}: client unavailable despite enabled+configured; returning 0`);
    return 0;
  }
  const { client, config: tenantConfig } = clientCtx;

  const commit = invoice.invoiceType != 'Estimate';
  console.log('Invoice type:', invoice.invoiceType, 'Committing to Avatax:', commit);

  try {
    const lines = invoice.lineItems.map((item, index) => ({
      number: (index + 1).toString(),
      quantity: 1,
      amount: item.amount,
      itemCode: item.itemNumber || 'DEFAULT',
      description: item.name
    }));

    const transactionModel = {
      code: invoice.invoiceNumber.toString(),
      customerCode: (invoice.customerId || '0').toString(),
      type: Enums.DocumentType.SalesInvoice,
      date: new Date(invoice.date || Date.now()),
      companyCode: tenantConfig.companyCode || DEFAULT_COMPANY_CODE,
      commit: commit,
      currencyCode: 'USD',
      taxCode: 'PC040206',
      addresses: {
        singleLocation: {
          line1: invoice.shipAddress1,
          line2: invoice.shipAddress2 || '',
          line3: invoice.shipAddress3 || '',
          city: invoice.shipCity,
          region: invoice.shipState,
          postalCode: invoice.shipZip
        }
      },
      lines: lines
    };

    const createOrAdjustTransactionModel = {
      createTransactionModel: transactionModel,
      adjustmentReason: Enums.AdjustmentReason.Other,
      adjustmentDescription: 'Invoice Creation or Update'
    };

    const result = await client.createOrAdjustTransaction({ model: createOrAdjustTransactionModel });

    let totalTax = 0;
    if (result && result.summary && Array.isArray(result.summary)) {
      result.summary.forEach((item: any) => {
        if (typeof item.tax === 'number') {
          totalTax += item.tax;
        }
      });
    }

    console.log("Total tax from Avalara for invoice", invoice._id, "is", totalTax);
    return totalTax;
  } catch (error: any) {
    let coreErrorMessage = "Failed to calculate tax";
    if (error && typeof error === 'object') {
      if (error.message) {
        coreErrorMessage = error.message;
      } else if (error.details && error.details.message) {
        coreErrorMessage = error.details.message;
      } else if (error.error && error.error.message) {
        coreErrorMessage = error.error.message;
      }
    }

    console.error('Avatax calculation error:', coreErrorMessage);
    console.log('Invoice data causing error:', JSON.stringify({
      _id: invoice._id || 'undefined',
      customerId: invoice.customerId || 'undefined',
      shipState: invoice.shipState || 'undefined'
    }));

    const errorMessage = "Tax calculation failure: " + coreErrorMessage;
    throw new Error(errorMessage);
  }
}
