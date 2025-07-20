// src/routes/loanCriteria.routes.js
import express from 'express';
import {
    createLoanCriteria,
    getAllLoanCriteria,
    getLoanCriteriaById,
    updateLoanCriteria,
    deleteLoanCriteria,
    getLoanCriteriaByBankId,
    getLoanCriteriaForAllBanks
} from '../controllers/loanCriteria.controller';
import { authMiddleware, hasRole } from '../middlewares/auth.middleware'; // Import your auth middleware
import { validateCreateLoanCriteria, validateUpdateLoanCriteria } from '../middlewares/validation.middleware';

const router = express.Router();

// Routes
router.post('/', authMiddleware, hasRole(['masterAdmin', 'admin', 'bankOperator']), validateCreateLoanCriteria, createLoanCriteria);
router.get('/', authMiddleware, hasRole(['masterAdmin', 'admin', 'bankOperator']), getAllLoanCriteria);
router.get('/:id', authMiddleware, hasRole(['masterAdmin', 'admin', 'bankOperator']), getLoanCriteriaById);
router.put('/:id', authMiddleware, hasRole(['masterAdmin', 'admin', 'bankOperator']), validateUpdateLoanCriteria, updateLoanCriteria);
router.delete('/:id', authMiddleware, hasRole(['masterAdmin', 'admin', 'bankOperator']), deleteLoanCriteria);
router.get('/bank/:bankId', authMiddleware, hasRole(['masterAdmin', 'admin', 'bankOperator']), getLoanCriteriaByBankId);
//fetch all loan criteria based on bank and branch
router.get('/banks/data', authMiddleware, getLoanCriteriaForAllBanks);

export default router;