import mongoose from "mongoose";

//import Counter from "./counter";

var ReturnSchema = new mongoose.Schema({
    _id: Number,
    customerName: String,
    customerId: Number,
    invoiceId: String,
    returnDate: Date,
    subTotal: Number,
    taxable: Boolean,
    salesTax: Number,
    shipping: Number,
    totalReturnAmount: Number,
    salesPerson: String,
    lineItems: [{
        productId: String,
        itemNumber: String,
        name: String,
        amount: Number,
        serialNo: String,
        longDesc: String,
        included: Boolean
    }],
    search: String
});

export const Return = mongoose.models.Return || mongoose.model('Return', ReturnSchema);
