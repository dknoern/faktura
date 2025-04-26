import { Invoice } from "../invoice-renderer";

import Avatax from 'avatax';
import * as Enums from 'avatax/lib/enums/index';

// Configure Avatax client with the required properties
const avataxConfig = {
  appName: 'Lager2App',
  appVersion: '1.0',
  environment: process.env.AVATAX_ENVIRONMENT || 'sandbox',
  machineName: process.env.AVATAX_MACHINE_NAME || 'local'
};

// Security credentials for Avatax
const avataxCredentials = {
  username: process.env.AVATAX_USERNAME,
  password: process.env.AVATAX_PASSWORD
};

/**
 * Calculate tax for an invoice using Avatax
 * @param invoice The invoice to calculate tax for
 * @returns The calculated tax amount
 */
export async function calcTax(invoice: Invoice): Promise<number> {
  console.log('Calculating tax for invoice', invoice._id);

  // Special cases where we don't need to calculate tax
  if (invoice.invoiceType === 'Estimate') {
    console.log('Estimate, will not calculate tax');
    return 0;
  } else if (!invoice.shipState) {
    console.log("State not specified, will not calculate tax");
    return 0;
  } else if (invoice.taxExempt) {
    console.log("Tax exempt, no tax");
    return 0;
  } else if (invoice.shipState === 'TX') {
    // Manual Texas tax calculation
    const totalTax = invoice.subtotal * 0.0825;
    console.log("Manually calculating TX tax:", totalTax);
    return totalTax;
  }

  try {
    // Create Avatax client

    console.log('Creating Avatax client, config:', avataxConfig, 'credentials:', avataxCredentials);
    const client = new Avatax(avataxConfig).withSecurity(avataxCredentials);

    // Prepare line items for tax calculation
    const lines = invoice.lineItems.map((item, index) => ({
      number: (index + 1).toString(),
      quantity: 1,
      amount: item.amount,
      itemCode: item.itemNumber || 'DEFAULT',
      description: item.name
    }));

    const transactionModel = {
      code: (invoice._id || '0').toString(),
      customerCode: (invoice.customerId || '0').toString(),
      type: Enums.DocumentType.SalesInvoice,
      date: new Date(invoice.date || Date.now()),
      companyCode: 'DEFAULT',
      commit: true,
      currencyCode: 'USD',
      taxCode: 'PC040206',
      addresses: {
        singleLocation: {
          line1: invoice.shipAddress1 ,
          line2: invoice.shipAddress2 || '',
          line3: invoice.shipAddress3 || '',
          city: invoice.shipCity ,
          region: invoice.shipState ,
          postalCode: invoice.shipZip
        }
      },
      lines: lines
    };


  


    // Call Avatax API to calculate tax



    const createOrAdjustTransactionModel = {
      createTransactionModel: transactionModel,
      adjustmentReason: Enums.AdjustmentReason.Other,
      adjustmentDescription: 'Invoice Creation or Update'
    };

    //const result = await client.createTransaction({ model: transactionModel });
    const result = await client.createOrAdjustTransaction({ model: createOrAdjustTransactionModel });
    // Calculate total tax from result
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
    console.error('Avatax calculation error:', error);
    console.log('Invoice data causing error:', JSON.stringify({
      _id: invoice._id || 'undefined',
      customerId: invoice.customerId || 'undefined',
      shipState: invoice.shipState || 'undefined'
    }));

    throw new Error("Failed to calculate tax");
  }
}