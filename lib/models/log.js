import mongoose from "mongoose";

var LineItemSchema = new mongoose.Schema({
    itemNumber: String,
    name: String,
    repairNumber: String,
    repairCost: Number,
    productId: String,
    repairId: String,
});

var LogSchema = new mongoose.Schema({
    date: Date,
    receivedFrom: String,
    comments: String,
    user: String,
    customerName: String,
    search: String,
    lineItems: {
        type: [LineItemSchema]
    }
});

export const Log = mongoose.models.Log || mongoose.model('Log', LogSchema);
