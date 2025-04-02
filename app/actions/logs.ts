'use server';

import { revalidatePath } from 'next/cache';
import { logModel } from '@/lib/models/log';
import dbConnect from '@/lib/dbConnect';
import { Types } from 'mongoose';

export async function createLog(data: any) {
  try {
    await dbConnect();
    
    const log = await logModel.create(data);
    
    revalidatePath('/dashboard/loginitems');
    return { success: true, data: log };
  } catch (error) {
    console.error('Error creating log:', error);
    return { success: false, error: 'Failed to create log item' };
  }
}

export async function updateLog(id: string, data: any) {
  try {
    await dbConnect();

    console.log(data);
    const collection = logModel.collection;

    const _id = new Types.ObjectId(id);

    const log = await collection.findOneAndUpdate({_id}, {$set: data});
    
    if (!log) {
      return { success: false, error: 'Log item not found' };
    }
    
    revalidatePath('/dashboard/loginitems');
    return { success: true, data: JSON.parse(JSON.stringify(log)) };
  } catch (error) {
    console.error('Error updating log:', error);
    return { success: false, error: 'Failed to update log item' };
  }
} 