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
    
    data.search = (formatDate(new Date()) + " "
    + data.receivedFrom + " "
    + valueOrBlank(data.customerName) + " "
    + (data.lineItems?.map(function (k:any) { return k.name }).join(",") || "") + " "
    + (data.lineItems?.map(function (k:any) { return valueOrBlank(k.itemNumber) }).join(" ") || "") + " "
    + (data.lineItems?.map(function (k:any) { return valueOrBlank(k.repairNumber) }).join(" ") || "") + " "
    + valueOrBlank(data.comments)).replace(/\s+/g, ' ').trim();
    
    const log = await logModel.create(data);

    // loop through line items and call receiveProduct
    if (data.lineItems) {
      for (const lineItem of data.lineItems) {
        await receiveProduct(log, lineItem);
        
        // Close any open repairs for this line item
        if (lineItem.repairId || lineItem.productId) {
          await closeRepair(lineItem, data.comments || '');
        }
      }
    }


    revalidatePath('/dashboard/loginitems');
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
    
    revalidatePath('/dashboard/loginitems');
    return { success: true, data: JSON.parse(JSON.stringify(log)) };
  } catch (error) {
    console.error('Error updating log:', error);
    return { success: false, error: 'Failed to update log item' };
  }
}

async function receiveProduct(log: any, lineItem: any) {
  try {
    const product = await productModel.findById(lineItem.productId).select('status history');
    
    if (!product) {
      console.log('Product not found:', lineItem.productId);
      return;
    }

    // replay events to figure out current status
    let sold = false;
    let repair = false;
    let memo = false;

    product.history?.forEach((element: { action: string }) => {
      if (element.action === 'sold item') {
        sold = true;
      } else if (element.action === 'item returned') {
        sold = false;
      } else if (element.action?.startsWith('in repair')) {
        repair = true;
      } else if (element.action === 'item memo') {
        memo = true;
      } else if (element.action === 'received') {
        if (repair) {
          repair = false;
        } else {
          sold = false; // cant be both sold and memoed
          memo = false;
        }
      }
      console.log("action = ", element.action, "sold = ", sold, "repair = ", repair, "memo = ", memo);
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

    console.log("checking existing product in, status was " + product.status + ", setting status to " + newStatus);
    
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

    console.log('added history line for itemNumber', lineItem.itemNumber);
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
    console.log('marking repairs for repairId', lineItem.repairId, 'or productId', lineItem.productId);

    const result = await Repair.updateMany(
      {
        $and: [
          { returnDate: { $eq: null } },
          {
            $or: [
              {
                _id: lineItem.repairId // _id never null
              },
              {
                $and: [
                  { itemId: lineItem.productId },
                  { itemId: { $ne: null } } // itemId could be null if not inventory item
                ]
              }
            ]
          }
        ]
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