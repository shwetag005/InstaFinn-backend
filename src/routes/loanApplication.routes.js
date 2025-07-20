
// // src/routes/loanApplication.routes.js
// import express from 'express';
// import {
//     createLoanApplication,
//     getAllLoanApplications,
//     getLoanApplicationById,
//     updateLoanApplication,
//     deleteLoanApplication,
//     getLoanApplicationsByUserId,
//     getLoanApplicationsByAgentId,
//     createLoanApplicationDocuments,
//     getVisibleLoanApplications
// } from '../controllers/loanApplication.controller';
// import { authMiddleware, hasRole } from '../middlewares/auth.middleware'; // Import your auth middleware
// import { transformLoanApplicationPayload, validateCreateLoanApplication, validateCreateLoanApplicationDocuments, validateUpdateLoanApplication } from '../middlewares/validation.middleware'; // Import validation middleware
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';

// // Configure storage
// // Define the upload directory
// const uploadDir = 'public/uploads/';

// // Ensure the upload directory exists
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true }); // recursive: true creates parent directories if needed
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });

// const upload = multer({ storage: storage });
// const router = express.Router();


// // Routes
// router.post('/', authMiddleware,transformLoanApplicationPayload, validateCreateLoanApplication, createLoanApplication); // User, Agent, SubAgent
// router.post('/upload/:id', authMiddleware,upload.array('documents'), validateCreateLoanApplicationDocuments, createLoanApplicationDocuments);
// router.get('/', authMiddleware, hasRole(['masterAdmin', 'admin', 'bankOperator,agent']), getAllLoanApplications); // Admin, Bank Operator
// router.get('/:id', authMiddleware, getLoanApplicationById); // All authenticated users
// // router.put('/:id', authMiddleware, validateUpdateLoanApplication, updateLoanApplication); // User, Agent, SubAgent
// router.put('/:id', authMiddleware, updateLoanApplication);
// router.delete('/:id', authMiddleware, deleteLoanApplication); // User, Agent, SubAgent
// router.get('/user', authMiddleware, hasRole(['user']), getLoanApplicationsByUserId); // User
// router.get('/:role/:id', authMiddleware, hasRole(['masterAdmin','agent', 'subAgent', 'bankOperator', 'admin','user']), getLoanApplicationsByAgentId); // Agent, SubAgent

// router.get('/visible', authenticate, getVisibleLoanApplications);


// export default router;


import express from 'express';
import multer from 'multer';
import fs from 'fs';
import {
    createLoanApplicationWithFiles,
    updateLoanApplicationWithFiles,
    updateLoanApplicationBankBranch,
    getAllLoanApplications,
    getLoanApplicationById,
    deleteLoanApplication,
    getLoanApplicationsByUserId,
    getLoanApplicationsByAgentId,
    createLoanApplicationDocuments,
    getVisibleLoanApplications,
    submitLoanDecisionController,
    
} from '../controllers/loanApplication.controller';
import { authMiddleware, hasRole } from '../middlewares/auth.middleware';
import { transformLoanApplicationPayload, validateCreateLoanApplication, validateCreateLoanApplicationDocuments } from '../middlewares/validation.middleware';
import { parseMultipartLoanApplication } from '../middlewares/parseMultipartData.js';


const router = express.Router();

const storage = multer.memoryStorage();

// ✅ Multer instance
const upload = multer({ storage,
  limits: {
    fileSize: 3 * 1024 * 1024, // ✅ Limit each file to 2MB
    files: 10,                 // ✅ Max 10 files per request
  },
 });

// ✅ Use consistent field names (matching frontend keys)
const multiUpload = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'aadhar', maxCount: 2 },
  { name: 'pancard', maxCount: 1 },
  { name: 'itr', maxCount: 5 },
  { name: 'credit_report', maxCount: 5 }
]);


// Debug middleware (optional but recommended)
const debugFormMiddleware = (req, res, next) => {
  console.log("🟨 Form Data:");
  console.dir(req.body, { depth: null });
  console.dir(req.files, { depth: null });
  next();
};

router.post('/', authMiddleware, multiUpload, debugFormMiddleware, parseMultipartLoanApplication , transformLoanApplicationPayload, createLoanApplicationWithFiles);  //validateCreateLoanApplication
router.post('/upload/:id', authMiddleware, upload.array('documents'), validateCreateLoanApplicationDocuments, createLoanApplicationDocuments);

router.get('/', authMiddleware, hasRole(['masterAdmin', 'admin', 'bankOperator', 'agent']), getAllLoanApplications);
router.get('/user', authMiddleware, hasRole(['user']), getLoanApplicationsByUserId);
router.get('/visible', authMiddleware, getVisibleLoanApplications);
router.get('/:id', authMiddleware, getLoanApplicationById);
//router.put('/:id', authMiddleware, updateLoanApplication);
router.put('/:id', authMiddleware, multiUpload, debugFormMiddleware, parseMultipartLoanApplication, updateLoanApplicationWithFiles);
router.patch('/:id/branch', authMiddleware, updateLoanApplicationBankBranch); 

router.delete('/:id', authMiddleware, deleteLoanApplication);
router.get('/:role/:id', authMiddleware, hasRole(['masterAdmin', 'agent', 'subAgent', 'bankOperator', 'admin', 'user']), getLoanApplicationsByAgentId);
router.post('/:id/decision', authMiddleware, submitLoanDecisionController );


export default router;
