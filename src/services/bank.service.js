// src/services/bank.service.js
import Bank from '../models/bank.model';
import Branch from '../models/branch.model';
import User from '../models/user.model';
import LoanCriteria from '../models/loanCriteria.model';

// services/bank.service.js
export const createBank = async (bankName) => {
  try {
    const isBankExist = await Bank.findOne({ bankName });
    if (isBankExist) {
      return { error: false, status: 400, message: 'Bank name already exists' };
    }

    const newBank = new Bank({ bankName });
    await newBank.save();

    return {
      error: false,
      status: 201,
      bank: newBank,
      message: 'Bank created successfully'
    };
  } catch (error) {
    if (error.code === 11000) {
      return { error: false, status: 400, message: 'Bank name already exists' };
    }
    return { error: true, status: 500, message: 'Server error' };
  }
};

// Get all banks
export const getAllBanks = async () => {
  try {
    const banks = await Bank.find().lean(); // returns plain JS objects
    
    for (let i = 0; i < banks.length; i++) {
      const branchCount = await Branch.countDocuments({ bankId: banks[i]._id });
      banks[i].branchCount = branchCount;
    }

    return banks;
  } catch (error) {
    throw new Error('Error fetching banks: ' + error.message);
  }
};


// Get bank by ID
export const getBankById = async (id) => {
  try {
    const bank = await Bank.findById(id).populate('branches'); // Populate branches
    if (!bank) {
      throw new Error('Bank not found');
    }
    return bank;
  } catch (error) {
    throw new Error('Error fetching bank: ' + error.message);
  }
};

// Update bank by ID
export const updateBank = async (id, updateData) => {
  try {
    const updatedBank = await Bank.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });
    if (!updatedBank) {
      throw new Error('Bank not found');
    }
    return updatedBank;
  } catch (error) {
    throw new Error('Error updating bank: ' + error.message);
  }
};

// Delete bank by ID
export const deleteBank = async (id) => {
  try {
    const deletedBank = await Bank.findByIdAndDelete(id);
    if (!deletedBank) {
      throw new Error('Bank not found');
    }
    return { message: 'Bank deleted successfully' };
  } catch (error) {
    throw new Error('Error deleting bank: ' + error.message);
  }
};

// Create a new branch
export const createBranch = async (branchData) => {
  try {
    const branch = await Branch.create(branchData);
    // Add the branch to the bank's branches array
    await Bank.findByIdAndUpdate(branchData.bankId, {
      $push: { branches: branch._id }
    });
    return branch;
  } catch (error) {
    throw new Error('Error creating branch: ' + error.message);
  }
};

// export const createUserThenBranch = async (data) => {
//   try {
//     const { email } = data;
//     const existingUser = await User.findOne({ email });

//     if (existingUser) {
//       throw new Error('Email already exists');
//     }
//     const isIFSCExist = await Branch.findOne({ ifscCode: data.ifscCode });
//     if (isIFSCExist) {
//       throw new Error('IFSC already exists');
//     }

//     const user = await User.create(data);
//     const branch = await Branch.create({ ...data, userId: user._id });

//     return { user, branch };
//   } catch (error) {
//     if (error.code === 11000) {
//       throw new Error('Email or mobile number already exists' + error.message);
//     }
//     throw new Error('Error creating user: ' + error.message);
//   }
// };




// Get all branches for a bank

export const createUserThenBranch = async (data) => {
  try {
    const { email } = data;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    const isIFSCExist = await Branch.findOne({ ifscCode: data.ifscCode });
    if (isIFSCExist) {
      throw new Error('IFSC already exists');
    }

    // 1. Create user first
    const user = await User.create({ ...data, branches: [] });

    // 2. Create branch and assign userId
    const branch = await Branch.create({ ...data, userId: user._id });

    // 3. Update user to include branch in 'branches' array
    await User.findByIdAndUpdate(user._id, {
      $push: { branches: branch._id }
    });

    return { user, branch };
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('Email or mobile number already exists' + error.message);
    }
    throw new Error('Error creating user: ' + error.message);
  }
};


export const getBranchesByBankId = async (bankId) => {
  try {
    const branches = await Branch.find({ bankId });
    return branches;
  } catch (error) {
    throw new Error('Error fetching branches: ' + error.message);
  }
};

//Get bank data and branch data with criteria based on user_id
export const getBankAndBranchData = async (userId) => {
  try {
    // const user = await User.findById(userId);
    // const bank = await Bank.findById(user.bankId);
    const branch = await Branch.find();
    let newbranch=branch.filter((branch) => branch.userId == userId);
    // const allBranches = await Branch.findAll();
    const criteria = await LoanCriteria.find();
    let newCriteria=criteria.filter((criteria) => criteria.branchId == newbranch[0]._id);
        // return { bank, branch, criteria };
    return {newbranch,newCriteria};
  } catch (error) {
    throw new Error('Error fetching bank and branch data: ' + error.message);
  }
};

// export const getBankAndBranchData = async (userId) => {
//   try {
//     console.log('getBankAndBranchData called with userId:', userId); // <--- Add this
//     const branches = await Branch.find({ userId }).populate('bankId', 'bankName');
//     console.log('branches:', branches); // <--- Add this

//     const result = await Promise.all(
//       branches.map(async (branch) => {
//         const criteriaList = await LoanCriteria.find({ branchId: branch._id });
//         return {
//           branchId: branch._id,
//           branchName: branch.bankBranch,
//           bankId: branch.bankId?._id,
//           bankName: branch.bankId?.bankName || '',
//           criteria: criteriaList.map(c => ({
//             ...c.toObject(),
//             criteria: c.loanCriteriaList || []
//           }))
//         };
//       })
//     );
//     console.log('result:', result); // <--- Add this

//     return result;
//   } catch (error) {
//     console.error('Error in getBankAndBranchData:', error); // <--- Add this
//     throw new Error('Error fetching bank and branch data: ' + error.message);
//   }
// };

// getBranchesByRoleAndUserId
export const getBranchesByRoleAndUserId = async (userId, role) => {
  try {
    const normalizedRole = role?.toLowerCase();

    if (['admin', 'superadmin', 'subagent', 'agent', 'masteradmin'].includes(normalizedRole)) {
      const allBanks = await Bank.find();
      const branchesData = [];

      for (const bank of allBanks) {
        const branches = await Branch.find({ bankId: bank._id }).populate('bankId', 'bankName');

        for (const branch of branches) {
          const loanCriteria = await LoanCriteria.findOne({
            bankId: bank._id,
            branchId: branch._id
          });

          branchesData.push({
            ...branch.toObject(),
            bankName: branch.bankId?.bankName || '',
            criteria: loanCriteria?.loanCriteriaList || []
          });
        }
      }

      return branchesData;
    } else {
      const branches = await Branch.find({ userId });

      const branchesWithCriteria = await Promise.all(
        branches.map(async (branch) => {
          const loanCriteria = await LoanCriteria.findOne({
            bankId: branch.bankId,
            branchId: branch._id
          });


          return {
            ...branch.toObject(),
            criteria: loanCriteria?.loanCriteriaList || []
          };
        })
      );

      return branchesWithCriteria;
    }
  } catch (error) {
    throw new Error('Error fetching branches: ' + error.message);
  }
};
