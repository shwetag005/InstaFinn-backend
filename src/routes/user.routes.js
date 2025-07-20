// src/routes/user.routes.js
import express from 'express';
import {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    loginController,
    sendOTPController,
    resendOTPController,
    createUser,
} from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware'; // Import your auth middleware
import { validateCreateUser, validateLoginCredentials } from '../middlewares/validation.middleware';

const router = express.Router();

// Public routes
router.post('/', validateCreateUser, createUser); // Apply validation middleware
//  Route for login
router.post('/login', validateLoginCredentials, loginController);

//  Route for sending OTP
router.post('/otp/send', sendOTPController);

//  Route for resending OTP
router.post('/otp/resend', resendOTPController);

// Protected routes (require authentication)
router.get('/below/:id', authMiddleware, getAllUsers);
router.get('/:id', authMiddleware, getUserById);
router.put('/:id', authMiddleware, updateUser);
router.delete('/:id', authMiddleware, deleteUser);

export default router;