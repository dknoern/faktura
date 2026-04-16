import dbConnect from './dbConnect';
import { Invoice } from "./models/invoice";
import { Repair } from './models/repair';
import { Return } from './models/return';
import { Wanted } from './models/wanted';
import { getTenantObjectId } from './tenant-utils';

export async function fetchInvoicesByCustomerId(customerId: string, page = 1, limit = 10) {
  try {
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();
    const skip = (page - 1) * limit;
    const filter = { customerId: customerId, tenantId: tenantObjectId };

    const invoices = await Invoice.find(filter)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Invoice.countDocuments(filter);

    return {
      invoices: JSON.parse(JSON.stringify(invoices)),
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    };
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    throw error;
  }
}

export async function fetchRepairsByCustomerId(customerId: string, page = 1, limit = 10) {
  try {
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();
    const skip = (page - 1) * limit;
    const filter = { customerId: customerId, tenantId: tenantObjectId, status: { $ne: 'Deleted' } };

    const repairs = await Repair.find(filter)
      .sort({ dateOut: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Repair.countDocuments(filter);

    return {
      repairs: JSON.parse(JSON.stringify(repairs)),
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    };
  } catch (error) {
    console.error('Error fetching customer repairs:', error);
    throw error;
  }
}

export async function fetchReturnsByCustomerId(customerId: string, page = 1, limit = 10) {
  try {
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();
    const skip = (page - 1) * limit;
    const filter = { customerId: customerId, tenantId: tenantObjectId };

    const returns = await Return.find(filter)
      .sort({ returnDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Return.countDocuments(filter);

    return {
      returns: JSON.parse(JSON.stringify(returns)),
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    };
  } catch (error) {
    console.error('Error fetching customer returns:', error);
    throw error;
  }
}


export async function fetchWantedsByCustomerId(customerId: string, page = 1, limit = 10) {
  try {
    await dbConnect();
    const tenantObjectId = await getTenantObjectId();
    const skip = (page - 1) * limit;
    const filter = { customerId: customerId, tenantId: tenantObjectId };

    const wanteds = await Wanted.find(filter)
      .sort({ dateOut: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Wanted.countDocuments(filter);

    return {
      wanteds: JSON.parse(JSON.stringify(wanteds)),
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    };
  } catch (error) {
    console.error('Error fetching customer wanteds:', error);
    throw error;
  }
}
