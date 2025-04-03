import dbConnect from './dbConnect';
import mongoose from 'mongoose';
import { Invoice } from './models/invoice';
import { productModel } from './models/product';
import { Return } from './models/return';
import { Repair } from './models/repair';
import { Out } from './models/out';
import { customerModel } from './models/customer';import { logModel } from './models/log';

export async function fetchCustomers(page = 1, limit = 10) {
    try {

        await dbConnect();
        const skip = (page - 1) * limit;
            const customers = await customerModel.find()
            .sort({ lastUpdated: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalCount = await customerModel.countDocuments();
        return {
            customers: JSON.parse(JSON.stringify(customers)),
            pagination: {
                total: totalCount,
                pages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            }
        };
    } catch (error) {
        console.error('Error fetching customers:', error);
        throw error;
    }
}


export async function fetchProducts(page = 1, limit = 10) {
    try {
        await dbConnect();
        const skip = (page - 1) * limit;
        const products = await productModel.find()
            .sort({ lastUpdated: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalCount = await productModel.countDocuments();
        return {
            products: JSON.parse(JSON.stringify(products)),
            pagination: {
                total: totalCount,
                pages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            }
        };
    } catch (error) {
        console.error('Error fetching products:', error);
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


export async function fetchInvoices(page = 1, limit = 10) {
    try {
        await dbConnect();
        const skip = (page - 1) * limit;
        const invoices = await Invoice.find()
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);
        
        // Get total count for pagination
        const totalCount = await Invoice.countDocuments();
        
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
        console.error('Error fetching invoices:', error);
        throw error;
    }
}


export async function fetchReturns(page = 1, limit = 10) {
    try {
        await dbConnect();
        const skip = (page - 1) * limit;
        const returns = await Return.find()
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalCount = await Return.countDocuments();
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
        console.error('Error fetching returns:', error);
        throw error;
    }
}


export async function fetchRepairs(page = 1, limit = 10 ) {
    try {
        await dbConnect();
        const skip = (page - 1) * limit;
        const repairs = await Repair.find()
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);
        
            const totalCount = await Repair.countDocuments();
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
        console.error('Error fetching returns:', error);
        throw error;
    }
}


export async function fetchLogs(page = 1, limit = 10) {
    try {
        await dbConnect();
        const skip = (page - 1) * limit;
        const logs = await logModel.find()
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalCount = await logModel.countDocuments();
        return {
            logs: JSON.parse(JSON.stringify(logs)),
            pagination: {
                total: totalCount,
                pages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            }
        };
    } catch (error) {
        console.error('Error fetching logs:', error);
        throw error;
    }
}


export async function fetchOuts(page = 1, limit = 10    ) {
    try {
        await dbConnect();
        const skip = (page - 1) * limit;
        const outs = await Out.find()
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalCount = await Out.countDocuments();
        return {
            outs: JSON.parse(JSON.stringify(outs)),
            pagination: {
                total: totalCount,
                pages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            }
        };
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
