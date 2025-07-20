// src/controllers/bank.controller.js
import { Request, Response } from 'express';
import {
  createBank as createBankService,
  getAllBanks as getAllBanksService,
  getBankById as getBankByIdService,
  updateBank as updateBankService,
  deleteBank as deleteBankService,
  createBranch as createBranchService,
  createUserThenBranch as createUserService,
  getBranchesByBankId as getBranchesByBankIdService,
  getBankAndBranchData,
  getBranchesByRoleAndUserId as getBranchesByRoleAndUserIdService,
 
} from '../services/bank.service';

// Create a new bank
export const createBank = async (req, res) => {
  try {
    const { bankName } = req.body;
    const result = await createBankService(bankName);

    if (result.error) {
      return res.status(result.status).json({ message: result.message });
    }

    return res.status(result.status).json({
      message: result.message,
      bank: result.bank
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all banks
export const getAllBanks = async (req, res) => {
  try {
    const banks = await getAllBanksService();
    res.status(200).json({message: 'Banks fetched successfully', data:banks});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get bank by ID
export const getBankById = async (req, res) => {
  try {
    const bank = await getBankByIdService(req.params.id);
    res.status(200).json(bank);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// Update bank by ID
export const updateBank = async (req, res) => {
  try {
    const updatedBank = await updateBankService(req.params.id, req.body);
    res.status(200).json(updatedBank);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// Delete bank by ID
export const deleteBank = async (req, res) => {
  try {
    const result = await deleteBankService(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// Create a new branch
export const createBranch = async (req, res) => {
  try {
    const branch = await createBranchService(req.body);
    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUserThenBranch = async (req, res) => {
  try {
    const { user, branch } = await createUserService(req.body);
    res.status(201).json({ message: 'User and Branch created', user, branch });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get all branches for a bank
export const getBranchesByBankId = async (req, res) => {
  try {
    const branches = await getBranchesByBankIdService(req.params.bankId);
    res.status(200).json({message: 'Branches fetched successfully', data:branches});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get Bank and Branch Data with criteria by userid
export const getBankDataByUserId = async (req, res) => {
  try {
    const result = await getBankAndBranchData(req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// getBranchesByRoleAndUserId
export const getBranchesByRoleAndUserId = async (req, res) => {
  try {
    const result = await getBranchesByRoleAndUserIdService(req.user.id, req.user.role);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

