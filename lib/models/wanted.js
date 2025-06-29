import mongoose from "mongoose";

var WantedSchema = new mongoose.Schema({
    title: String,
    description: String,
    customerName: String,
    customerId: Number,
    createdDate: { type: Date, default: Date.now },
    foundDate: Date,
    createdBy: String,
    foundBy: String,
    search: String
});

export const Wanted = mongoose.models.Wanted || mongoose.model('Wanted', WantedSchema);
