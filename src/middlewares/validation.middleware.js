// src/middlewares/validation.middleware.js
import Joi from 'joi';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { normalizeRole } from '../utils/normalizeRole.js';


// Validation schema for creating a new user

const createUserSchema = Joi.object({
  fullName: Joi.string().required(),
  address: Joi.string().required(),
  pin: Joi.string().required(),
  email: Joi.string().email().required(),
  mobileNumber: Joi.string().required(),
  role: Joi.string()
    .valid('masterAdmin', 'admin', 'agent', 'subAgent', 'bankOperator', 'user')
    .required(),
  password: Joi.string().min(6).optional(),
  applicationCount: Joi.string().default(0),
  totalBusiness: Joi.string().default(0),
  rank: Joi.string().default(0),
  profileUrl: Joi.string().optional(),
  createdBy: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        //check if the value exists before validating.
        return helpers.error('any.invalid');
      }
      return value;
    })
    .optional(),
  bankId: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .optional(),
  agentId: Joi.string()
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .optional(),
  branches: Joi.array()
    .items(
      Joi.string().custom((value, helpers) => {
        if (value && !mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      })
    )
    .optional(),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional()
}).required();

// // Middleware to validate the request body for creating a new user
// export const validateCreateUser = (req, res, next) => {
//   const { error } = createUserSchema.validate(req.body);
//   if (error) {
//     return res.status(400).json({ message: error.details[0].message });
//   }
//   next();
// };

export const validateCreateUser = (req, res, next) => {
  // ✅ Normalize role before Joi schema validates it
  if (req.body.role) {
    req.body.role = normalizeRole(req.body.role);
  }

  const { error } = createUserSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};


// Joi Validation Schema
const validateLoginSchema = Joi.object({
  mobileNumber: Joi.string().required(),
  otp: Joi.string().min(6).max(6).required() // OTP is required for OTP login
}).required();

export const validateLoginCredentials = (req, res, next) => {
  const { error } = validateLoginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

// Utility function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, 'your-secret-key', { expiresIn: '1h' }); // Replace 'your-secret-key'
};

//  OTP Service Functions (otpService.js) - separate file
export const generateOTP = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // Generate a 6-character OTP
};

// Validation schema for creating a new bank
export const validateCreateBank = (req, res, next) => {
  const createBankSchema = Joi.object({
    bankName: Joi.string().required()
  }).required();

  const { error } = createBankSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

// Validation schema for creating a new branch
export const validateCreateBranch = (req, res, next) => {
  
  if (req.body.role) {
    req.body.role = normalizeRole(req.body.role);
  }
  
  const createBranchSchema = Joi.object({
    bankId: Joi.string().required(), //  You might want to validate as an ObjectId().
    name: Joi.string().required(),
    location: Joi.string().required(),
    ifscCode: Joi.string().required(),
    contactPerson: Joi.string()
  }).required();

  const { error } = createBranchSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

// {
// "fullName":"Loan Operator",
// "address":"At. Kapileshwar Tal. Radhanagari Dist. Kolhapur",
// "pin":"416208",
// "email":"bankoperator@gmail.com",
// "role":"bankOperator",
// "bankId":"68282ab965d33b277c094322",
// "bankBranch":"Shahupuri",
// "bankLocation":"1477, fhfuihsd, fhodih",
// "mobileNumber":"7485145785",
// "bankName":"Cosmos Bank",
// "bankPersonDesignation":"loan operator",
// "bankPersonEId":"C147",
// "createdBy":"6826dabd5646513020c275ab"
// }
export const validateUserBranch = (req, res, next) => {
  const createUserBranchSchema = Joi.object({
    fullName: Joi.string().required(),
    address: Joi.string().required(),
    pin: Joi.string().required(),
    email: Joi.string().email().required(),
    role: Joi.string().required(),
    bankId: Joi.string().required(),
    bankBranch: Joi.string().required(),
    bankLocation: Joi.string().required(),
    mobileNumber: Joi.string().required(),
    bankName: Joi.string().required(),
    bankPin: Joi.string().required(),
    bankPersonDesignation: Joi.string().required(),
    bankPersonEId: Joi.string().required(),
    createdBy: Joi.string().required(),
    ifscCode: Joi.string().required()
  }).required();

  const { error } = createUserBranchSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

// Validation schema for creating a new loan application

const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

export const validateCreateLoanApplication = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().required().custom(objectIdValidator),
    agentId: Joi.string().optional().custom(objectIdValidator),
    createdBy: Joi.string().required().custom(objectIdValidator),
    
    // Nested personal info
    personalInfo: Joi.object({
      applicantName: Joi.string().required(),
      applicantDob: Joi.date().iso().required(),
      applicantGender: Joi.string().valid('Male', 'Female', 'Other').required(),
      applicantAddress: Joi.string().required(),
      applicantEmail: Joi.string().email().required(),
      applicantMobile: Joi.string().required(),
      applicantNationality: Joi.string().optional().allow(null, ''),
      applicantPin: Joi.string().optional().allow(null, ''),
      pan: Joi.string().optional().allow(null, '')
    }).required(),
    
    // Nested family info
    familyInfo: Joi.object({
      maritalStatus: Joi.string().valid('Single', 'Married', 'Divorced', 'Separated', 'Widowed').optional(),
      spouseName: Joi.string().optional().allow(null, ''),
      spouseDOB: Joi.date().iso().optional().allow(null, ''),
      childrenCount: Joi.number().optional().allow(null),
      fatherName: Joi.string().optional().allow(null, ''),
      fatherDOB: Joi.date().iso().optional().allow(null, ''),
      motherName: Joi.string().optional().allow(null, ''),
      motherDOB: Joi.date().iso().optional().allow(null, '')
    }).optional(),
    
    // Nested employment info
    employmentInfo: Joi.object({
      incomeSource: Joi.string().required(),
      annualIncome: Joi.number().positive().optional(),
      employerOrBusinessName: Joi.string().optional().allow(null, ''),
      employerAddress: Joi.string().optional().allow(null, ''),
      workEmail: Joi.string().email().optional().allow(null, '')
    }).required(),
    
    // Nested loan details
    loanDetails: Joi.object({
      loanAmount: Joi.number().positive().required(),
      loanPurpose: Joi.string().optional().allow(null, ''),
      loanTerm: Joi.number().positive().integer().optional(),
      interestRate: Joi.number().positive().optional(),
      emiAmount: Joi.number().positive().optional(),
      loanType: Joi.string().optional()
    }).required(),
    // write joi schema for 
    // const BankDataSchema = new mongoose.Schema({
    //   bankId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bank', required: true },
    //   branches: [{
    //     branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    //     loanTypes: [{ type: String }]
    //   }]
    // }, { _id: false });

    // Nested bank data
   bankData: Joi.object({
    bankId: Joi.array().items(
      Joi.object({
        branches: Joi.array().items(
          Joi.object({
            branchId: Joi.string().required().custom(objectIdValidator),
            loanTypes: Joi.array().items(Joi.string()).min(1).required()
          })
        ).min(1).required()
      })
    ).min(1).required()
  }).optional(),
    // Nested property investment
    propertyInvestment: Joi.object({
      propertyAddress: Joi.string().optional().allow(null, ''),
      propertyValue: Joi.number().positive().optional(),
      investmentAmount: Joi.number().positive().optional(),
      investmentType: Joi.string().optional().allow(null, '')
    }).optional(),
    
    // Other fields
    creditScore: Joi.number().positive().integer().optional(),
    references: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        phone: Joi.string().required(),
        relationship: Joi.string().required()
      })
    ).optional(),
    collateral: Joi.string().optional().allow(null, ''),
    collateralDescription: Joi.string().optional().allow(null, ''),
    criteriaValues: Joi.array().items(
      Joi.object({
        criteriaId: Joi.string().required().custom(objectIdValidator),
        value: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.date(), Joi.boolean()).required()
      })
    ).optional(),
    documents: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        url: Joi.string().uri().required(),
        type: Joi.string().valid('photo', 'aadhar', 'pan', 'itr', 'credit_report').required()
      })
    ).optional(),
    status: Joi.string().default('Pending').valid('Pending', 'Approved', 'Rejected', 'Processing'),
    applicationDate: Joi.date().default(Date.now)
  });

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      message: 'Validation failed',
      details: error.details.map((d) => d.message)
    });
  }

  next();
};

export const transformLoanApplicationPayload = (req, res, next) => {
  const flatData = req.body;
  
  // Skip transformation if already nested
  if (flatData.personalInfo) {
    return next();
  }

  req.body = {
    userId: flatData.userId,
    agentId: flatData.agentId,
    createdBy: flatData.createdBy,
    personalInfo: {
      applicantName: flatData.applicantName,
      applicantDob: flatData.applicantDob,
      applicantGender: flatData.applicantGender,
      applicantAddress: flatData.applicantAddress,
      applicantEmail: flatData.applicantEmail,
      applicantMobile: flatData.applicantMobile,
      applicantNationality: flatData.applicantNationality,
      applicantPin: flatData.applicantPin,
      pan: flatData.pan
    },
    familyInfo: {
      maritalStatus: flatData.maritalStatus,
      spouseName: flatData.spouseName,
      spouseDOB: flatData.spouseDOB,
      childrenCount: flatData.childrenCount,
      fatherName: flatData.fatherName,
      fatherDOB: flatData.fatherDOB,
      motherName: flatData.motherName,
      motherDOB: flatData.motherDOB
    },
    employmentInfo: {
      incomeSource: flatData.incomeSource,
      annualIncome: flatData.annualIncome,
      employerOrBusinessName: flatData.employerOrBusinessName,
      employerAddress: flatData.employerAddress,
      workEmail: flatData.workEmail
    },
    loanDetails: {
      loanAmount: flatData.loanAmount,
      loanPurpose: flatData.loanPurpose,
      loanTerm: flatData.loanTerm,
      interestRate: flatData.interestRate,
      emiAmount: flatData.emiAmount,
      loanType: flatData.loanType
    },
    propertyInvestment: {
      propertyAddress: flatData.propertyAddress,
      propertyValue: flatData.propertyValue,
      investmentAmount: flatData.investmentAmount,
      investmentType: flatData.investmentType
    },
    creditScore: flatData.creditScore,
    references: flatData.references,
    collateral: flatData.collateral,
    collateralDescription: flatData.collateralDescription,
    criteriaValues: flatData.criteriaValues,
    documents: flatData.documents
  };

  next();
};

//loan application id, and documents
export const validateCreateLoanApplicationDocuments = (req, res, next) => {
  const schema = Joi.object({
    loanApplicationId: Joi.string().required().custom(objectIdValidator),
    documents: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        url: Joi.string().uri().required(),
        type: Joi.string().optional().allow(null, '')
      })
    ).required()
  });

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      message: 'Validation failed',
      details: error.details.map((d) => d.message)
    });
  }
}

// Validation schema for updating a loan application
export const validateUpdateLoanApplication = (req, res, next) => {
  const updateLoanApplicationSchema = Joi.object({
    status: Joi.string().valid(
      'pending',
      'approved',
      'rejected',
      'resubmitted'
    ),
    bankData: Joi.object({
      bankId: Joi.string().required().custom(objectIdValidator),
      branches: Joi.array().items(
        Joi.object({
          branchId: Joi.string().required().custom(objectIdValidator),
          loanTypes: Joi.array().items(Joi.string()).min(1).required()
        })
      ).min(1).required()
    }).optional(),
    interestRate: Joi.number().positive(),
    approvedAmount: Joi.number().positive(),
    rejectionReason: Joi.string(),
    criteriaValues: Joi.array().items(
      Joi.object({
        criteriaId: Joi.string().required(),
        value: Joi.alternatives()
          .try(Joi.number(), Joi.string(), Joi.date(), Joi.boolean())
          .required()
      })
    ),
    documents: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        url: Joi.string().uri().required(),
        type: Joi.string()
      })
    )
  })
    .min(1)
    .required(); // At least one field must be present for update

  const { error } = updateLoanApplicationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

// Validation schema for creating a new loan criteria
export const validateCreateLoanCriteria = (req, res, next) => {
  const objectId = (value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  };

  const salarySchema = Joi.object({
    salary: Joi.boolean().default(false),
    income: Joi.number().empty('').allow(null).default(100000),
    creditScore: Joi.number().empty('').allow(null).default(650),
    collateral: Joi.string().empty('').allow(null).default('0% to 10%'),
    dti: Joi.string().empty('').allow(null).default('0% to 10%')
  }).default();

  const businessSchema = Joi.object({
    business: Joi.boolean().default(false),
    income: Joi.number().empty('').allow(null).default(300000),
    creditScore: Joi.number().empty('').allow(null).default(600),
    collateral: Joi.string().empty('').allow(null).default('0% to 10%'),
    dti: Joi.string().empty('').allow(null).default('0% to 10%')
  }).default();

  const criteriaSchema = Joi.object({
    loanType: Joi.string().required(),
    criteria: Joi.object({
      salary: salarySchema,
      business: businessSchema
    }).required()
  });
  
  const createLoanCriteriaSchema = Joi.object({
    bankId: Joi.string().custom(objectId).required(),
    branchId: Joi.string().custom(objectId).required(),
    loanCriteriaList: Joi.array().items(criteriaSchema).min(1).required()
  });


  const { error, value } = createLoanCriteriaSchema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false
  });

  if (error) {
    return res.status(400).json({
      message: 'Validation failed',
      details: error.details.map((d) => d.message)
    });
  }

  // update request with cleaned values
  req.body = value;
  next();
};

// Validation schema for updating loan criteria
export const validateUpdateLoanCriteria = (req, res, next) => {
  const updateLoanCriteriaSchema = Joi.object({
    bankId: Joi.string(),
    branchId: Joi.string(),
    criteriaName: Joi.string(),
    criteriaDescription: Joi.string(),
    minValue: Joi.number().when('dataType', {
      // Added dataType check
      is: 'number',
      then: Joi.number().optional(),
      otherwise: Joi.forbidden()
    }),
    maxValue: Joi.number().when('dataType', {
      // Added dataType check
      is: 'number',
      then: Joi.number().optional(),
      otherwise: Joi.forbidden()
    }),
    dataType: Joi.string().valid('number', 'string', 'date', 'boolean'),
    required: Joi.boolean()
  })
    .min(1)
    .required();

  const { error } = updateLoanCriteriaSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};
