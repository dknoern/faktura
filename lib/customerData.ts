import dbConnect from './dbConnect';
import { Invoice } from "./models/invoice";
import { Repair } from './models/repair';
import { Return } from './models/return';
import { Wanted } from './models/wanted';

export async function fetchInvoicesByCustomerId(customerId: number, page = 1, limit = 10) {
  try {
    await dbConnect();
    const skip = (page - 1) * limit;

    const invoices = await Invoice.find({ customerId: customerId })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Invoice.countDocuments({ customerId: customerId });

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

export async function fetchRepairsByCustomerId(customerId: number, page = 1, limit = 10) {
  try {
    await dbConnect();
    const skip = (page - 1) * limit;

    const repairs = await Repair.find({ customerId: customerId })
      .sort({ dateOut: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Repair.countDocuments({ customerId: customerId });

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

export async function fetchReturnsByCustomerId(customerId: number, page = 1, limit = 10) {
  try {
    await dbConnect();
    const skip = (page - 1) * limit;

    const returns = await Return.find({ customerId: customerId })
      .sort({ returnDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Return.countDocuments({ customerId: customerId });

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


export async function fetchWantedsByCustomerId(customerId: number, page = 1, limit = 10) {
  try {
    await dbConnect();
    const skip = (page - 1) * limit;

    const wanteds = await Wanted.find({ customerId: customerId })
      .sort({ dateOut: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Wanted.countDocuments({ customerId: customerId });

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
