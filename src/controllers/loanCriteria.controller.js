// src/controllers/loanCriteria.controller.js
import { Request, Response } from 'express';
import {
    createLoanCriteria as createLoanCriteriaService,
    getAllLoanCriteria as getAllLoanCriteriaService,
    getLoanCriteriaById as getLoanCriteriaByIdService,
    updateLoanCriteria as updateLoanCriteriaService,
    deleteLoanCriteria as deleteLoanCriteriaService,
    getLoanCriteriaByBankId as getLoanCriteriaByBankIdService,
    getAllBanksLoanCriteria as getAllBanksLoanCriteriaService
} from '../services/loanCriteria.service';

// Create a new loan criteria
export const createLoanCriteria = async (req, res) => {
    try {        
        const criteria = await createLoanCriteriaService(req.body);
        res.status(201).json(criteria);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all loan criteria
export const getAllLoanCriteria = async (req, res) => {
    try {
        const criteria = await getAllLoanCriteriaService();
        res.status(200).json(criteria);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get loan criteria by ID
export const getLoanCriteriaById = async (req, res) => {
    try {
        const criteria = await getLoanCriteriaByIdService(req.params.id);
        res.status(200).json(criteria);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Update loan criteria by ID
export const updateLoanCriteria = async (req, res) => {
    try {
        const updatedCriteria = await updateLoanCriteriaService(req.params.id, req.body);
        res.status(200).json(updatedCriteria);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Delete loan criteria by ID
export const deleteLoanCriteria = async (req, res) => {
    try {
        const result = await deleteLoanCriteriaService(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// Get loan criteria by bank ID
export const getLoanCriteriaByBankId = async (req, res) => {
    try {
        const criteria = await getLoanCriteriaByBankIdService(req.params.bankId);
        res.status(200).json(criteria);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//getLoanCriteriaForAllBanks 
export const getLoanCriteriaForAllBanks = async (req, res) => {
    console.log('entered')
    try {
        console.log('getLoanCriteriaForAllBanks');
        const criteria = await getAllBanksLoanCriteriaService();
        res.status(200).json(criteria);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};