import express from 'express';

import { authMiddleware, hasRole } from '../middlewares/auth.middleware'; // Import your auth middleware
import { getLoanApplicationStatus } from '../controllers/other.controller';

const router = express.Router();

router.get('/applicationStatus',authMiddleware, hasRole(['masterAdmin', 'admin', 'bankOperator', 'agent', 'subAgent']), getLoanApplicationStatus); // get application status


export default router;
