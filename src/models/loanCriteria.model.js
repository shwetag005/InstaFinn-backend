import mongoose from 'mongoose';
const criteriaSchema = new mongoose.Schema({
  loanType: { type: String, required: true },
  criteria: {
    salary: {
      salary: { type: Boolean, default: false },
      income: { type: Number, default: 100000 },
      creditScore: { type: Number, default: 650 },
      collateral: { type: String, default: '0% to 10%' }, // updated
      dti: { type: String, default: '0% to 10%' } // updated
    },
    business: {
      business: { type: Boolean, default: false },
      income: { type: Number, default: 300000 },
      creditScore: { type: Number, default: 600 },
      collateral: { type: String, default: '0% to 10%' }, // updated
      dti: { type: String, default: '0% to 10%' } // updated
    }
  }
});

const loanCriteriaSchema = new mongoose.Schema({
  bankId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank', required: true },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  loanCriteriaList: [criteriaSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const LoanCriteria = mongoose.model('LoanCriteria', loanCriteriaSchema);
export default LoanCriteria;
