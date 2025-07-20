
// src/models/branch.model.js
import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  bankId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank', required: true },
  //bankName: { type: String, required: true },
  bankLocation: { type: String, required: true },
  ifscCode: { type: String, required: true },
  bankPin: { type: String, required: true },
  bankBranch: { type: String, required: true },
  bankPersonDesignation: { type: String, required: true },
  bankPersonEId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

});

const Branch = mongoose.model('Branch', branchSchema);
export default Branch;