'use server';

import { revalidatePath } from 'next/cache';
import { logModel } from '@/lib/models/log';
import dbConnect from '@/lib/dbConnect';

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
    
    const log = await logModel.findByIdAndUpdate(id, data, { new: true });
    
    if (!log) {
      return { success: false, error: 'Log item not found' };
    }
    
    revalidatePath('/dashboard/loginitems');
    return { success: true, data: log };
  } catch (error) {
    console.error('Error updating log:', error);
    return { success: false, error: 'Failed to update log item' };
  }
} 