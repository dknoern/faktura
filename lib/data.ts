import dbConnect from './dbConnect';
import mongoose from 'mongoose';
import { Invoice } from './models/invoice';
import { productModel } from './models/product';
import { Return } from './models/return';
import { Repair } from './models/repair';
import { Out } from './models/out';
import { customerModel } from './models/customer';import { logModel } from './models/log';

export async function fetchNewestCustomers() {
    try {

        await dbConnect();
        const customers = await customerModel.find().sort({ lastUpdated: -1 }).limit(10);
        return customers;
    } catch (error) {
        console.error('Error fetching newest customers:', error);
        throw error;
    }
}

export async function fetchProducts() {
    try {
        await dbConnect();
        const products = await productModel.find().sort({ lastUpdated: -1 }).limit(10);
        return products;
    } catch (error) {
        console.error('Error fetching newest customers:', error);
        throw error;
    }
}


export async function fetchProductById(id: string) {
    try {
        console.log('getting product by id----:', id);
        await dbConnect();
        var _id = new mongoose.Types.ObjectId(id);
        const product = await productModel.findOne({_id: _id});
        product.id = id;
        console.log('product:', product);

        return product;
    } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
    }
}


export async function fetchCustomerById(id: number) {
    try {
        console.log('getting customer by id----:', id);
        await dbConnect();
        const customer = await customerModel.findOne({_id: id});
        return customer;
    } catch (error) {
        console.error('Error fetching customer:', error);
        throw error;
    }
}


export async function fetchInvoices() {
    try {
        await dbConnect();
        const invoices = await Invoice.find().sort({ _id: -1 }).limit(10);
        return invoices;
    } catch (error) {
        console.error('Error fetching newest customers:', error);
        throw error;
    }
}

export async function fetchReturns() {
    try {
        await dbConnect();
        const returns = await Return.find().sort({ _id: -1 }).limit(10);
        return returns;
    } catch (error) {
        console.error('Error fetching returns:', error);
        throw error;
    }
}


export async function fetchRepairs() {
    try {
        await dbConnect();
        const repairs = await Repair.find().sort({ _id: -1 }).limit(10);
        return repairs;
    } catch (error) {
        console.error('Error fetching returns:', error);
        throw error;
    }
}



export async function fetchLogs() {
    try {
        await dbConnect();
        const logs = await logModel.find().sort({ _id: -1 }).limit(10);
        return logs;
    } catch (error) {
        console.error('Error fetching logs:', error);
        throw error;
    }
}

export async function fetchOuts() {
    try {
        await dbConnect();
        const outs = await Out.find().sort({ _id: -1 }).limit(10);
        return outs;
    } catch (error) {
        console.error('Error fetching outs:', error);
        throw error;
    }
}

export async function getRepairsForItem(productId: string) {
    try {
        await dbConnect();
        const repairs = await Repair.find({itemId:productId});
        return repairs;
    } catch (error) {
        console.error('Error fetching outs:', error);
        throw error;
    }
}

export async function fetchLogItemById(id: string) {
    try {
        await dbConnect();
        console.log('Database connected, attempting to fetch log with id:', id);

        // Get the raw collection and convert to ObjectId
        const collection = logModel.collection;
        const _id = new mongoose.Types.ObjectId(id);
        
        // Use raw MongoDB query that we know works
        const log = await collection.findOne({ _id });
        
        if (!log) {
            console.log('No document found with ID:', id);
            return null;
        }
        log.id = id;

        console.log('Found document:', log);
        return log;
    } catch (error) {
        console.error('Error fetching log item:', error);
        throw error;
    }
}


