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
/*
ReturnSchema.pre('save', function (next) {
    if (this._id == null) {
        Counter.findByIdAndUpdate({_id: 'returnNumber'}, {$inc: {seq: 1}}, (error, counter) => {
            if (error)
                return next(error);
            this._id = counter.seq;
            console.log("returnNumber: " + this._id);

            next();
        });
    } else {
        next();
    }
});
*/
export const Return = mongoose.models.Return || mongoose.model('Return', ReturnSchema);
