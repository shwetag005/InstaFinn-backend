import {
  createLoanApplication as createLoanApplicationService,
  getAllLoanApplications as getAllLoanApplicationsService,
  getLoanApplicationById as getLoanApplicationByIdService,
  deleteLoanApplication as deleteLoanApplicationService,
  getLoanApplicationsByUserId as getLoanApplicationsByUserIdService,
  getLoanApplicationsByAgentId as getLoanApplicationsByAgentIdService,
  createLoanApplicationDocumentService,
  processLoanDecision,
  updateLoanApplicationWithFilesService,
  updateLoanApplicationBranchService
} from '../services/loanApplication.service.js';

import LoanApplication from '../models/loanApplication.model.js'; 
import User from '../models/user.model.js'; 
import { request } from 'express';
import cloudinary , {uploadToCloudinary, deleteFromCloudinaryByUrl} from '../config/cloudinary.js';
import { copyFileSync } from 'fs';


export const createLoanApplicationWithFiles = async (req, res) => {
  // console.log("📦 Incoming Body:", Object.keys(req.body));
  // console.log("📂 Incoming Files:", Object.keys(req.files));

  try {
    // Safe parse function
    const safeParse = (input, key = "") => {
      if (typeof input === "string") {
        try {
          return JSON.parse(input);
        } catch (e) {
          console.error(`❌ JSON Parse Error for ${key}:`, input);
          return {};
        }
      }
      return input;
    };

    // ✅ Parse fields
    const personalInfo = safeParse(req.body.personalInfo, "personalInfo");
    const familyInfo = safeParse(req.body.familyInfo, "familyInfo");
    const employmentInfo = safeParse(req.body.employmentInfo, "employmentInfo");
    const loanDetails = safeParse(req.body.loanDetails, "loanDetails");
    const propertyInvestment = safeParse(req.body.propertyInvestment, "propertyInvestment");
    const references = safeParse(req.body.references, "references");
    const criteriaValues = safeParse(req.body.criteriaValues, "criteriaValues");

    const creditScore = req.body.creditScore ? parseInt(req.body.creditScore, 10) : null;
    const userId = req.body.userId;
    const createdBy = req.body.createdBy;

    const parseDate = (str) => (str ? new Date(str) : null);
    if (personalInfo.applicantDob) personalInfo.applicantDob = parseDate(personalInfo.applicantDob);
    if (familyInfo.spouseDOB) familyInfo.spouseDOB = parseDate(familyInfo.spouseDOB);
    if (familyInfo.fatherDOB) familyInfo.fatherDOB = parseDate(familyInfo.fatherDOB);
    if (familyInfo.motherDOB) familyInfo.motherDOB = parseDate(familyInfo.motherDOB);

    if (familyInfo.childrenCount)
      familyInfo.childrenCount = parseInt(familyInfo.childrenCount, 10);
    if (loanDetails.loanAmount)
      loanDetails.loanAmount = parseInt(loanDetails.loanAmount, 10);
    if (loanDetails.emiAmount)
      loanDetails.emiAmount = parseInt(loanDetails.emiAmount, 10);

    const applicationPayload = {
      userId,
      createdBy,
      personalInfo,
      familyInfo,
      employmentInfo,
      loanDetails,
      propertyInvestment,
      creditScore,
      references,
      criteriaValues,
      collateral: req.body.collateral,
      collateralDescription: req.body.collateralDescription,
    };

    // ✅ Save the application
    const application = await createLoanApplicationService(
      applicationPayload,
      req.user?.id || userId
    );

    // ✅ Upload files concurrently
    const uploadedDocuments = [];

    if (req.files && Object.keys(req.files).length > 0) {
      const fileUploadPromises = [];

      for (const field in req.files) {
        const files = req.files[field];
        for (const file of files) {
          const uploadPromise = uploadToCloudinary(file, `loan_documents/${application._id}/${field}`);
          fileUploadPromises.push(uploadPromise);
        }
      }

      // Upload all at once
      const results = await Promise.all(fileUploadPromises);
      uploadedDocuments.push(...results);
    }

    // ✅ Save to DB
    if (uploadedDocuments.length > 0) {
      await createLoanApplicationDocumentService(
        {
          applicationId: application._id,
          documents: uploadedDocuments,
        },
        req.user?.id || userId
      );
    }

    res.status(201).json({
      message: "Loan application created with files successfully",
      data: application,
    });

  } catch (error) {
    console.error("❌ [LoanApp Error]", error);
    res.status(500).json({
      message: "Failed to create loan application with files",
      error: error.message,
    });
  }
};

export const createLoanApplicationDocuments = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const { documents } = req.body;
    const userId = req.user.id;

    const result = await createLoanApplicationDocumentService(
      { applicationId, documents },
      userId
      
    );

    res.status(201).json({
      message: 'Documents uploaded successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({ message: error.message });
  }
};//

// ✅ Get all applications
export const getAllLoanApplications = async (req, res) => {
  try {
    const applications = await getAllLoanApplicationsService();
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get by ID
export const getLoanApplicationById = async (req, res) => {
  try {
    const application = await getLoanApplicationByIdService(req.params.id);
    res.status(200).json(application);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};


export const updateLoanApplicationWithFiles = async (req, res) => {
  try {
    const loanId = req.params.id;
    const role = req.user.role;
    const userId = req.user._id;

    // ✅ Parse JSON safely
    const safeParse = (input, key = "") => {
      if (typeof input === "string") {
        try {
          return JSON.parse(input);
        } catch (e) {
          console.error(`❌ JSON Parse Error for ${key}:`, input);
          return {};
        }
      }
      return input;
    };

    // ✅ Extract and parse all form fields
    const personalInfo = safeParse(req.body.personalInfo, "personalInfo");
    const familyInfo = safeParse(req.body.familyInfo, "familyInfo");
    const employmentInfo = safeParse(req.body.employmentInfo, "employmentInfo");
    const loanDetails = safeParse(req.body.loanDetails, "loanDetails");
    const propertyInvestment = safeParse(req.body.propertyInvestment, "propertyInvestment");
    const references = safeParse(req.body.references, "references");
    const criteriaValues = safeParse(req.body.criteriaValues, "criteriaValues");
    const data = safeParse(req.body.data, "data"); // bankData
    const removedFiles = safeParse(req.body.removedFiles, "removedFiles") || [];

    const creditScore = req.body.creditScore ? parseInt(req.body.creditScore, 10) : null;

    const updateData = {
      personalInfo,
      familyInfo,
      employmentInfo,
      loanDetails,
      propertyInvestment,
      creditScore,
      references,
      criteriaValues,
      collateral: req.body.collateral,
      collateralDescription: req.body.collateralDescription,
      data
    };

    // 🔍 Fetch current application for existing documents
    const application = await LoanApplication.findById(loanId);
    if (!application) {
      return res.status(404).json({ error: "Loan application not found" });
    }

    const applicationDocs = application.documents || [];

    // ✅ Delete removed files from Cloudinary
    for (const removed of removedFiles) {
      if (removed.url) {
        await deleteFromCloudinaryByUrl(removed.url);
      }
    }

    // ✅ Upload new files to Cloudinary
    const uploadedDocuments = [];
    if (req.files && Object.keys(req.files).length > 0) {
      const fileUploadPromises = [];

      for (const field in req.files) {
        for (const file of req.files[field]) {
          const uploadPromise = uploadToCloudinary(file, `loan_documents/${loanId}/${field}`);
          fileUploadPromises.push(uploadPromise);
        }
      }

      const results = await Promise.all(fileUploadPromises);
      uploadedDocuments.push(...results);
    }
// ✅ Delete old files of the same type if replaced
    for (const uploaded of uploadedDocuments) {
      const oldDoc = applicationDocs.find(doc => doc.type === uploaded.type);
      if (oldDoc && oldDoc.url) {
        await deleteFromCloudinaryByUrl(oldDoc.url);
      }
    }

    // ✅ Construct final documents list: exclude removed and replaced files
    const finalDocuments = [
      ...applicationDocs.filter(
        doc =>
          !removedFiles.some(r => r.url === doc.url) &&
          !uploadedDocuments.some(u => u.type === doc.type)
      ),
      ...uploadedDocuments
    ];

    updateData.documents = finalDocuments;

    // ✅ Call update service
    const updatedApp = await updateLoanApplicationWithFilesService(
      loanId,
      updateData,
      role,
      userId
    );

    res.status(200).json({
      message: "Loan application updated successfully",
      data: updatedApp
    });

  } catch (error) {
    console.error("❌ Error updating loan application:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const updateLoanApplicationBankBranch = async (req, res) => {
  try {
    const loanId = req.params.id;
    const role = req.user.role;
    const userId = req.user._id;
    const updateData = req.body;

    const updatedApp = await updateLoanApplicationBranchService(loanId, updateData, role, userId);

    res.status(200).json({
      message: "Bank branch updated successfully",
      data: updatedApp
    });
  } catch (error) {
    console.error("❌ Error updating bank branch:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// export const updateLoanApplication = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const role = req.user.role;
//     const userId = req.user.id;

//     // 🛡️ Authorization and role-based logic stays the same

//     // 🔧 Parse formData safely like createLoanApplicationWithFiles
//     const safeParse = (input, key = "") => {
//       if (typeof input === "string") {
//         try {
//           return JSON.parse(input);
//         } catch (e) {
//           console.error(`❌ JSON Parse Error for ${key}:`, input);
//           return {};
//         }
//       }
//       return input;
//     };
//     console.log("🔧 Update Request:", req.params, req.body, req.files, id, role,userId,req);
//     console.log("🔧 Update Payload:", req.body);
//     console.log("🔧 Update Files:", req.files);

//     const personalInfo = safeParse(req.body.personalInfo, "personalInfo");
//     const familyInfo = safeParse(req.body.familyInfo, "familyInfo");
//     const employmentInfo = safeParse(req.body.employmentInfo, "employmentInfo");
//     const loanDetails = safeParse(req.body.loanDetails, "loanDetails");
//     const propertyInvestment = safeParse(req.body.propertyInvestment, "propertyInvestment");
//     const references = safeParse(req.body.references, "references");
//     const criteriaValues = safeParse(req.body.criteriaValues, "criteriaValues");

//     const creditScore = req.body.creditScore ? parseInt(req.body.creditScore, 10) : null;
//     const updatedData = {
//       personalInfo,
//       familyInfo,
//       employmentInfo,
//       loanDetails,
//       propertyInvestment,
//       creditScore,
//       references,
//       criteriaValues,
//       collateral: req.body.collateral,
//       collateralDescription: req.body.collateralDescription,
//     };
// console.log("🔧 Update Payload:", updatedData);
//     // 📁 Handle updated file uploads
//     const uploadedDocuments = [];
//     if (req.files && Object.keys(req.files).length > 0) {
//       for (const field in req.files) {
//         const fileArray = req.files[field];
//         for (const file of fileArray) {
//           const result = await cloudinary.uploader.upload(file.path, {
//             folder: `loan_documents/${id}/${field}`,
//           });

//           uploadedDocuments.push({
//             name: file.originalname,
//             url: result.secure_url,
//             type: field,
//           });
//         }
//       }
//     }
//     console.log("📂 Uploaded Documents:", uploadedDocuments);

//     if (uploadedDocuments.length > 0) {
//       await LoanApplication.findByIdAndUpdate(id, {
//         $push: { documents: { $each: uploadedDocuments } },
//       });
//     }

//     const updatedApp = await updateLoanApplicationService(id, req, role, userId);

//     res.status(200).json({ message: "Application updated successfully", data: updatedApp });
//   } catch (error) {
//     console.error("❌ Error updating application:", error);
//     res.status(400).json({ message: "Error updating loan application: " + error.message });
//   }
// };



// ✅ Delete

export const deleteLoanApplication = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;
    const result = await deleteLoanApplicationService(req.params.id, role, userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ Get by user ID
export const getLoanApplicationsByUserId = async (req, res) => {
  try {
    const userId = req.user.id;
    const applications = await getLoanApplicationsByUserIdService(userId);
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get by agent ID
export const getLoanApplicationsByAgentId = async (req, res) => {
  try {
    const agentId = req.user._id;
    const agentRole = req.user.role;
    const applications = await getLoanApplicationsByAgentIdService(agentRole, agentId);
    res.status(200).json({ message: "Loan applications retrieved successfully", data: applications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getVisibleLoanApplications = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user._id;

    let query = {};

    if (role === 'subAgent') {
      query.createdBy = userId;

    } else if (role === 'agent') {
      const subAgents = await User.find({ createdBy: userId, role: 'subAgent' }).select('_id');
      query.createdBy = { $in: [userId, ...subAgents.map(u => u._id)] };
      
    } else if (role === 'admin') {
      // const agents = await User.find({ createdBy: userId, role: 'agent' }).select('_id');
      // const subAgents = await User.find({ createdBy: { $in: agents.map(a => a._id) }, role: 'subAgent' }).select('_id');
      // query.createdBy = { $in: subAgents.map(sa => sa._id) };

      const agents = await User.find({ createdBy: userId, role: 'agent' }).select('_id');
      const agentIds = agents.map(a => a._id);

      const subAgents = await User.find({
        createdBy: { $in: agentIds },
        role: 'subAgent',
      }).select('_id');
      const subAgentIds = subAgents.map(sa => sa._id);

      // ✅ Include both agents and sub-agents
      query.createdBy = { $in: [...agentIds, ...subAgentIds] };
    } else if (role === 'bankOperator') {
      // console.log("Bank operator branchIds:", branchIds);
      // console.log("Final query for loan apps:", JSON.stringify(query, null, 2));

     const branchIds = req.user.branches || (req.user.branchId ? [req.user.branchId] : []);
     console.log("Bank operator branchIds:", branchIds);

    if (branchIds.length === 0) {
      return res.status(400).json({ message: "Bank operator has no branch assigned." });
    }

    query = {
      bankData: {
        $elemMatch: {
          branches: {
            $elemMatch: {
              branchId: { $in: branchIds }
          }
        }
      }
    }
  };

    } // masterAdmin or any other roles: see all

    const loanApplications = await LoanApplication.find(query).populate('userId agentId')
                                    .populate('bankData.bankId', 'bankName') // ✅ populate bank name
                                    .populate('bankData.branches.branchId','bankBranch');

    res.status(200).json({
      message: 'Loan applications fetched successfully',
      data: loanApplications,
    });

  } catch (error) {
    console.error('Error fetching loan applications:', error);
    res.status(500).json({
      message: 'Error fetching loan applications',
      error: error.message,
    });
  }
};

export const submitLoanDecisionController = async (req, res) => {
  try {
    const { id: loanId } = req.params;
    const { isAccepted, approvedAmount, interestRate, rejectionReason } = req.body;
    const userId = req.user._id;

    const result = await processLoanDecision({
      loanId,
      isAccepted,
      approvedAmount,
      interestRate,
      rejectionReason,
      userId,
    });

    res.status(200).json({ message: 'Decision recorded', data: result });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};
