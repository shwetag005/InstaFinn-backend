// src/routes/bank.routes.js
import express from 'express';
import {
    createBank,
    getAllBanks,
    getBankById,
    updateBank,
    deleteBank,
    createBranch,
    getBranchesByBankId,
    createUserThenBranch,
    getBankDataByUserId,
    getBranchesByRoleAndUserId,
    
} from '../controllers/bank.controller';
import { authMiddleware, hasRole } from '../middlewares/auth.middleware'; // Import your auth middleware
import { validateCreateBank, validateCreateBranch, validateCreateUser, validateUserBranch } from '../middlewares/validation.middleware'; // Import validation middleware

const router = express.Router();

// Bank routes

router.post('/', authMiddleware, validateCreateBank, createBank); // Apply validation and auth
router.get('/', authMiddleware, getAllBanks);
router.get('/:id', authMiddleware, getBankById);
router.put('/:id', authMiddleware, updateBank);
router.delete('/:id', authMiddleware, deleteBank);

// Branch routes
router.post('/:bankId/branches', authMiddleware, validateUserBranch, createUserThenBranch);
router.get('/:bankId/branches', authMiddleware, getBranchesByBankId);

// Get Bank Data by user_id
router.get('/user/:id', authMiddleware, getBankDataByUserId);

//Get Branch data based user role and user id
router.get('/:role/:id', authMiddleware, hasRole(['masterAdmin','subAgent', 'admin', 'bankOperator', 'agent']), getBranchesByRoleAndUserId);



export default router;
