// src/services/loanCriteria.service.js
import LoanCriteria from '../models/loanCriteria.model';
import  Bank from '../models/bank.model'; // Import Bank and Branch if needed for validation
import Branch from '../models/branch.model';
// Create a new loan criteria
export const createLoanCriteria = async (criteriaData) => {
  try {
    const { bankId, branchId, loanCriteriaList } = criteriaData;

    // 1. Validate bank and branch
    const bank = await Bank.findById(bankId);
    if (!bank) throw new Error('Bank not found');

    if (branchId) {
      const branch = await Branch.findById(branchId);
      if (!branch) throw new Error('Branch not found');
      if (branch.bankId.toString() !== bankId)
        throw new Error('Branch does not belong to the specified bank');
    }

    const existingCriteria = await LoanCriteria.findOne({ bankId, branchId });

    if (!existingCriteria) {
      // 2. Create new record if none exists
      const newRecord = await LoanCriteria.create({
        bankId,
        branchId,
        loanCriteriaList
      });
      return newRecord;
    }

    // 3. Separate updates vs new loan types
    const updatedLoanTypes = [];
    const newLoanTypes = [];

    for (const incoming of loanCriteriaList) {
      const existing = existingCriteria.loanCriteriaList.find(
        (c) => c.loanType === incoming.loanType
      );

      if (existing) {
        // update existing
        existing.criteria = incoming.criteria;
        updatedLoanTypes.push(incoming.loanType);
      } else {
        // add new
        newLoanTypes.push(incoming);
      }
    }

    // 4. Push new loan types
    if (newLoanTypes.length > 0) {
      existingCriteria.loanCriteriaList.push(...newLoanTypes);
    }

    // 5. Save updated document
    await existingCriteria.save();

    return {
      message: 'Loan criteria updated successfully',
      updatedLoanTypes,
      newLoanTypes: newLoanTypes.map((l) => l.loanType),
    };
  } catch (error) {
    throw new Error('Error creating/updating loan criteria: ' + error.message);
  }
};


// Get all loan criteria
export const getAllLoanCriteria = async () => {
    try {
        const criteria = await LoanCriteria.find().populate('bankId', 'name').populate('branchId', 'name location');
        return criteria;
    } catch (error) {
        throw new Error('Error fetching loan criteria: ' + error.message);
    }
};

// Get loan criteria by ID
export const getLoanCriteriaById = async (id) => {
    try {
        const criteria = await LoanCriteria.findById(id).populate('bankId', 'name').populate('branchId', 'name location');
        if (!criteria) {
            throw new Error('Loan criteria not found');
        }
        return criteria;
    } catch (error) {
        throw new Error('Error fetching loan criteria: ' + error.message);
    }
};

// Update loan criteria by ID
export const updateLoanCriteria = async (id, updateData) => {
    try {
        // 1.  Verify that the bank exists (if bankId is being updated)
        if (updateData.bankId) {
            const bank = await Bank.findById(updateData.bankId);
            if (!bank) {
                throw new Error('Bank not found');
            }
        }
        // 2. Verify that the branch exists (if branchId is being updated)
        if (updateData.branchId) {
            const branch = await Branch.findById(updateData.branchId);
            if (!branch) {
                throw new Error('Branch not found');
            }
            if (updateData.bankId && branch.bankId.toString() !== updateData.bankId) {
                throw new Error('Branch does not belong to the specified bank');
            }
        }

        const updatedCriteria = await LoanCriteria.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('bankId', 'name').populate('branchId', 'name location');
        if (!updatedCriteria) {
            throw new Error('Loan criteria not found');
        }
        return updatedCriteria;
    } catch (error) {
        throw new Error('Error updating loan criteria: ' + error.message);
    }
};

// Delete loan criteria by ID
export const deleteLoanCriteria = async (id) => {
    try {
        const deletedCriteria = await LoanCriteria.findByIdAndDelete(id);
        if (!deletedCriteria) {
            throw new Error('Loan criteria not found');
        }
        return { message: 'Loan criteria deleted successfully' };
    } catch (error) {
        throw new Error('Error deleting loan criteria: ' + error.message);
    }
};

// Get loan criteria by bank ID
export const getLoanCriteriaByBankId = async (bankId) => {
    try {
        const criteria = await LoanCriteria.find({ bankId: bankId }).populate('bankId', 'name').populate('branchId', 'name location');
        return criteria;
    } catch (error) {
        throw new Error('Error fetching loan criteria: ' + error.message);
    }
};

//getAllLoanCriteriaService
export const getAllBanksLoanCriteria = async () => {
  try {
    const banks = await Bank.findAll();
    const branches = await Branch.find();
    const loanCriteria = await LoanCriteria.find();

    // for (let i = 0; i < banks.length; i++) {
    //   // Add branches to bank
    //   banks[i] = banks[i].toObject(); // Convert Mongoose doc to plain object
    //   banks[i].branches = branches
    //     .filter((branch) => branch.bankId.toString() === banks[i]._id.toString())
    //     .map((branch) => {
    //       const b = branch.toObject();
    //       b.criteria = loanCriteria.filter(
    //         (criteria) => criteria.branchId.toString() === b._id.toString()
    //       );
    //       return b;
    //     });
    // }

    return banks;
  } catch (error) {
    throw new Error('Error fetching loan criteria: ' + error.message);
  }
};
