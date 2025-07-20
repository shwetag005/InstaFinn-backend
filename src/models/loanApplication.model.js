import mongoose from 'mongoose';

export const PersonalInfoSchema = new mongoose.Schema(
  {
    applicantName: { type: String, required: true },
    applicantDob: { type: Date, required: true },
    applicantGender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true
    },
    applicantAddress: { type: String, required: true },
    applicantEmail: { type: String, required: true },
    applicantMobile: { type: String, required: true },
    applicantNationality: { type: String },
    applicantPin: { type: String },
    pan: { type: String }
  },
  { _id: false }
);

export const FamilyInfoSchema = new mongoose.Schema(
  {
    maritalStatus: {
      type: String,
      enum: ['Single', 'Married', 'Divorced', 'Separated', 'Widowed']
    },
    spouseName: { type: String },
    spouseDOB: { type: Date },
    childrenCount: { type: Number },
    fatherName: { type: String },
    fatherDOB: { type: Date },
    motherName: { type: String },
    motherDOB: { type: Date }
  },
  { _id: false }
);

export const EmploymentInfoSchema = new mongoose.Schema(
  {
    incomeSource: { type: String, required: true },
    annualIncome: { type: Number },
    employerOrBusinessName: { type: String },
    employerAddress: { type: String },
    workEmail: { type: String }
  },
  { _id: false }
);

export const LoanDetailsSchema = new mongoose.Schema(
  {
    loanAmount: { type: Number, required: true },
    loanPurpose: { type: String },
    loanTerm: { type: Number },
    interestRate: { type: Number },
    emiAmount: { type: Number },
    loanType: { type: String }
  },
  { _id: false }
);

export const PropertyInvestmentSchema = new mongoose.Schema(
  {
    propertyAddress: { type: String },
    propertyValue: { type: Number },
    investmentAmount: { type: Number },
    investmentType: { type: String }
  },
  { _id: false }
);

export const ReferenceSchema = new mongoose.Schema(
  {
    name: { type: String },
    phone: { type: String },
    relationship: { type: String }
  },
  { _id: false }
);

export const DocumentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ['photo', 'aadhar', 'pancard', 'itr', 'credit_report'],
      required: true
    }
  },
  { _id: false }
);

export const BankDataSchema = new mongoose.Schema(
  {
    bankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bank',
      required: true
    },
    branches: [
      {
        branchId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Branch',
          required: true
        },
        loanTypes: [
          {
            type: String,
            required: true // optional: enforce loanTypes must exist
          }
        ]
      }
    ]
  },
  { _id: false }
);

const LoanApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // bankId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bank',required:false }],
  // branchId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch',required:false }],

  personalInfo: PersonalInfoSchema,
  familyInfo: FamilyInfoSchema,
  employmentInfo: EmploymentInfoSchema,
  loanDetails: LoanDetailsSchema,
  propertyInvestment: PropertyInvestmentSchema,
  bankData: [BankDataSchema],
  creditScore: { type: Number },
  references: [ReferenceSchema],
  documents: [DocumentSchema],
  creditReport: [{ type: Object }],
  collateral: { type: String },
  collateralDescription: { type: String },

  criteriaValues: [
    {
      criteriaId: { type: mongoose.Schema.Types.ObjectId, ref: 'LoanCriteria' },
      value: { type: mongoose.Schema.Types.Mixed, required: true }
    }
  ],

  documents: [DocumentSchema],
  status: { type: String, default: 'Pending' },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

LoanApplicationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});



//export default mongoose.model('LoanApplication', LoanApplicationSchema);
module.exports = mongoose.model('LoanApplication', LoanApplicationSchema);


