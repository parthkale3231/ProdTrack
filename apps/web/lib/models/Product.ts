import mongoose, { Schema } from 'mongoose';

const OperationStatusSchema = new Schema({
  stdTime: { type: Number, required: true },
  inTime: { type: String },
  outTime: { type: String },
  leadTime: { type: Number },
  productNo: { type: String },
  processName: { type: String },
  operator: { type: String },
  status: { type: String, enum: ["Pending", "In Progress", "Completed"] },
}, { _id: false });

const ProductSchema = new Schema({
  itemNo: { type: String, required: true, unique: true },
  lastExec: { type: String },
  itemNoStyle: { type: String },
  desc: { type: String },
  poNo: { type: String },
  lineNo: { type: Number },
  poDate: { type: String },
  poConfirmDelDate: { type: String },
  remainingDays: { type: Schema.Types.Mixed },
  remainingStyle: { type: String },
  stdLeadTime: { type: Number },
  woNo: { type: String },
  startDate: { type: String },
  endDate: { type: String },
  totalLeadTime: { type: Number },
  currentLeadTime: { type: Number },
  operations: {
    listProvided: OperationStatusSchema,
    cuttingCompleted: OperationStatusSchema,
    roughTurning1: OperationStatusSchema,
    roughTurning2: OperationStatusSchema,
    heatTreatment: OperationStatusSchema,
    finish1st: OperationStatusSchema,
    finish2nd: OperationStatusSchema,
    slotting: OperationStatusSchema,
    inspection: OperationStatusSchema,
    rfd: OperationStatusSchema,
    dispatch: OperationStatusSchema,
  },
  remark: { type: String },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
