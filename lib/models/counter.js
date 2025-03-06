import mongoose from "mongoose";

var CounterSchema = new mongoose.Schema({
    _id: {type: String, required: true},
    seq: {type: Number, default: 0}
});

export const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);
