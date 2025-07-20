// src/models/bank.model.js
import mongoose from 'mongoose';

const bankSchema = new mongoose.Schema(
  {
    bankName: {
      type: String,
      required: [true, 'Bank name is required'],
      unique: true, // tells MongoDB to create a unique index
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // auto-manage createdAt and updatedAt
  }
);

// Optional: Add pre-save hook to update `updatedAt`
bankSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure the unique index is created
bankSchema.index({ bankName: 1 }, { unique: true });

const Bank = mongoose.model('Bank', bankSchema);

const bankDecisionSchema = new mongoose.Schema({
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'LoanApplication', required: true },
  bankOperatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isAccepted: { type: Boolean, required: true },
  approvedAmount: { type: Number },
  interestRate: { type: Number },
  rejectionReason: { type: String },
  decisionAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const BankDecision = mongoose.model('BankDecision', bankDecisionSchema);


export default Bank;
