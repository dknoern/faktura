
import mongoose from 'mongoose';
import dbConnect from './dbConnect';
import { Invoice } from './models/invoice';
import { Product } from './models/product';
import { Return } from './models/return';
import { Repair } from './models/repair';
import { Log } from './models/log';
import { Out } from './models/out';
const CustomerSchema = new mongoose.Schema({
    _id: Number,
    firstName: String,
    lastName: String,
    company: String,
    email: String,
    phone: String,
    cell: String,
    address1: String,
    address2: String,
    address3: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    billingAddress1: String,
    billingAddress2: String,
    billingAddress3: String,
    billingCity: String,
    billingState: String,
    billingZip: String,
    billingCountry: String,
    lastUpdated: Date,
    search: String,
    copyAddress: Boolean,
    customerType: String,
    status: String
});

const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);

export default Customer
export async function fetchNewestCustomers() {
    try {

        await dbConnect();
        const customers = await Customer.find().sort({ lastUpdated: -1 }).limit(10);
        return customers;
    } catch (error) {
        console.error('Error fetching newest customers:', error);
        throw error;
    }
}

export async function fetchProducts() {
    try {
        await dbConnect();
        const products = await Product.find().sort({ lastUpdated: -1 }).limit(10);
        return products;
    } catch (error) {
        console.error('Error fetching newest customers:', error);
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
        const logs = await Log.find().sort({ _id: -1 }).limit(10);
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