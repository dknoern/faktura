import mongoose from "mongoose";

var OutSchema = new mongoose.Schema({
    date: Date,
    sentTo: String,
    description: String,
    comments: String,
    user: String,
    search: String,
    signature: String,
    signatureDate: Date,
    signatureUser: String,
    status: { type: String, default: 'Active' },
    lastUpdated: { type: Date, default: Date.now }
});

export const Out = mongoose.models.Out || mongoose.model('Out', OutSchema);
