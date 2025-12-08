import mongoose, { Schema } from 'mongoose';

const LineItemSchema = new Schema({
  productId: String,
  itemNumber: String,
  name: String,
  amount: Number,
  serialNo: String,
  longDesc: String,
  included: Boolean
});

const ReturnSchema = new Schema({
  returnNumber: Number,
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  customerName: { type: String, required: true },
  customerId: Number,
  invoiceId: { type: String, required: true },
  returnDate: { type: Date, required: true },
  subTotal: { type: Number, required: true },
  taxable: { type: Boolean, default: false },
  salesTax: { type: Number, required: true },
  shipping: { type: Number, default: 0 },
  totalReturnAmount: { type: Number, required: true },
  salesPerson: String,
  search: String,
  lineItems: [LineItemSchema]
}, {
  timestamps: true
});

export const Return = mongoose.models.Return || mongoose.model('Return', ReturnSchema);
