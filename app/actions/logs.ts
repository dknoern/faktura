'use server';

import { revalidatePath } from 'next/cache';
import { logModel, logSchema } from '@/lib/models/log';
import dbConnect from '@/lib/dbConnect';
import { Types } from 'mongoose';
import { z } from 'zod';
import { format } from 'date-fns';
import { productModel } from '@/lib/models/product';
import { Repair } from '@/lib/models/repair';

type LogData = z.infer<typeof logSchema>;

function valueOrBlank(value: string | undefined){
  if(value !=null) return value;
  return "";
}

function formatDate(date: Date | null) {
  if (date == null) return "";
  else {
      return format(date, 'yyyy-MM-dd');
  }
}

export async function createLog(data: LogData) {
  try {
    await dbConnect();

    data.search = buildSearchString(data);
   
    const log = await logModel.create(data);

    // loop through line items and call receiveProduct
    if (data.lineItems) {
      for (const lineItem of data.lineItems) {
        if (lineItem.productId) {
          await receiveProduct(log, lineItem);
        }
        
        // Close any open repairs for this line item
        if (lineItem.repairId || lineItem.productId) {
          await closeRepair(lineItem, data.comments || '');
        }
      }
    }
    

    revalidatePath('/loginitems');
    return { success: true, data: JSON.parse(JSON.stringify(log)) };
  } catch (error) {
    console.error('Error creating log:', error);
    return { success: false, error: 'Failed to create log item' };
  }
}

export async function updateLog(id: string, data: LogData) {
  try {
    await dbConnect();

    const collection = logModel.collection;

    const _id = new Types.ObjectId(id);

    data.search = buildSearchString(data);

    const log = await collection.findOneAndUpdate({_id}, {$set: data});
    
    if (!log) {
      return { success: false, error: 'Log item not found' };
    }

    // Update repair details for each line item
    if (data.lineItems) {
      for (const lineItem of data.lineItems) {
        if (lineItem.repairId) {
          await updateRepairDetails(lineItem, data.comments || '');
        }
      }
    }
    
    revalidatePath('/loginitems');
    return { success: true, data: JSON.parse(JSON.stringify(log)) };
  } catch (error) {
    console.error('Error updating log:', error);
    return { success: false, error: 'Failed to update log item' };
  }
}

async function receiveProduct(log: any, lineItem: any) {
  try {

    // don't try if productId is not def
    const product = await productModel.findById(lineItem.productId).select('status history');
    
    if (!product) {
      console.log('Product not found:', lineItem.productId);
      return;
    }

    // replay events to figure out current status
    let sold = false;
    let repair = false;
    let memo = false;

    // reduce history to list of action strings
    const actions = product.history?.map((element: { action: string }) => element.action) || [];
    actions.push('received');

    actions.forEach((action: string) => {
      if (action === 'sold item') {
        sold = true;
        memo = false
      } else if (action === 'item returned') {
        sold = false;
        memo = false;
      } else if (action?.startsWith('in repair')) {
        repair = true;
      } else if (action === 'item memo') {
        memo = true;
        sold = false;
      } else if (action === 'received') {
        if (repair) {
          repair = false;
        } else {
          sold = false;
          memo = false;
        }
      }
    });

    // figure out new state for received item
    let newStatus = product.status;

    // item could be in repair even if sold or memoed
    if (repair) {
      if (sold) {
        newStatus = "Sold";
      } else if (memo) {
        newStatus = "Memo";
      } else {
        newStatus = "In Stock";
      }
    } else {
      newStatus = "In Stock";
    }

    const updates = {
      lastUpdated: new Date(),
      status: newStatus
    };

    // create new history item and update product status
    await productModel.findOneAndUpdate(
      { _id: lineItem.productId },
      {
        $push: {
          history: {
            user: log.user,
            date: new Date(),
            action: "received",
            itemReceived: lineItem.name,
            receivedFrom: log.receivedFrom,
            repairNumber: lineItem.repairNumber,
            customerName: log.customerName,
            comments: log.comments,
            repairCost: lineItem.repairCost,
            refDoc: log.id || log._id
          }
        },
        $set: updates
      },
      { upsert: true }
    );

  } catch (error) {
    console.error('error adding history:', error);
  }
}

async function updateRepairDetails(lineItem: any, comments: string) {
  try {
    console.log('updating repair details for repairId', lineItem.repairId, 'or productId', lineItem.productId);

    const result = await Repair.updateMany(
      {
        _id: lineItem.repairId
      },
      {
        repairCost: lineItem.repairCost,
        repairNotes: comments
      }
    );

    console.log('updated', result.modifiedCount, 'repairs for repairId', lineItem.repairId, 'or productId', lineItem.productId);
  } catch (error) {
    console.error('Error updating repair details:', error);
  }
}

async function closeRepair(lineItem: any, comments: string) {
  try {
    console.log('closing repair for repairId', lineItem.repairId);

    const result = await Repair.updateOne(
      {
        _id: lineItem.repairId
      },
      {
        returnDate: new Date(),
        repairCost: lineItem.repairCost,
        repairNotes: comments
      }
    );

    console.log('closed', result.modifiedCount, 'repairs for repairId', lineItem.repairId, 'or productId', lineItem.productId);
  } catch (error) {
    console.error('Error closing repair:', error);
  }
}

function buildSearchString(data: { date: Date; receivedFrom: string; id?: string | undefined; comments?: string | undefined; user?: string | undefined; customerName?: string | undefined; vendor?: string | undefined; search?: string | undefined; lineItems?: { itemNumber?: string | undefined; name?: string | undefined; repairNumber?: string | undefined; repairCost?: number | undefined; productId?: string | undefined; repairId?: string | undefined; }[] | undefined; }): string | undefined {
  return (formatDate(new Date()) + " "
    + data.receivedFrom + " "
    + valueOrBlank(data.customerName) + " "
    + valueOrBlank(data.vendor) + " "
    + valueOrBlank(data.user) + " "
    + (data.lineItems?.map(function (k:any) { return k.name }).join(",") || "") + " "
    + (data.lineItems?.map(function (k:any) { return valueOrBlank(k.itemNumber) }).join(" ") || "") + " "
    + (data.lineItems?.map(function (k:any) { return valueOrBlank(k.repairNumber) }).join(" ") || "") + " "
    + valueOrBlank(data.comments)).replace(/\s+/g, ' ').trim();
}
