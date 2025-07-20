// Assuming multer is set up
import cloudinary from 'cloudinary';
// src/services/loanApplication.service.js
import LoanApplication from '../models/loanApplication.model';
import LoanCriteria  from '../models/loanCriteria.model'; // Import LoanCriteria
import User from '../models/user.model'; // Import User\
import Branch from '../models/branch.model'
import { application } from 'express';
import  mongoose  from 'mongoose';
//import BankDecision from '../models/loanApplication.model';
import { BankDecision } from '../models/bank.model';

export const createLoanApplication = async (applicationData, id) => {
  console.log(applicationData, id);
  try {
    const application = await LoanApplication.create(applicationData);
    console.log(application);

    let newApplication = {};
    newApplication["status"] = application?.status;
    newApplication["_id"] = application?._id;
    newApplication["userId"] = application?.userId;
    newApplication["personalInfo"] = application?.personalInfo;
    newApplication["familyInfo"] = application?.familyInfo;
    newApplication["employmentInfo"] = application?.employmentInfo;
    newApplication["loanDetails"] = application?.loanDetails;
    newApplication["creditScore"] = application?.creditScore;
    newApplication["agentId"] = id;

    return newApplication;
  } catch (error) {
    return error.message;
  }
};

export const createLoanApplicationDocumentService = async (applicationData, userId) => {
  try {
    const application = await LoanApplication.findByIdAndUpdate(
      applicationData.applicationId,
      { $push: { documents: { $each: applicationData.documents } } },
      { new: true }
    );
    return application;
  } catch (error) {
    throw new Error(error.message);
  }
}


export const uploadDocuments = async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    const uploadedDocs = [];

    for (const key in req.files) {
      const fileArray = Array.isArray(req.files[key]) ? req.files[key] : [req.files[key]];
      
      for (const file of fileArray) {
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: `loan_documents/${applicationId}`
        });

        uploadedDocs.push({
          name: key,
          url: result.secure_url,
          type: result.resource_type
        });
      }
    }

    const updatedApp = await LoanApplication.findByIdAndUpdate(
      applicationId,
      { $push: { documents: { $each: uploadedDocs } } },
      { new: true }
    );

    res.status(200).json({ message: 'Documents uploaded', updatedApp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadLoanApplicationFiles = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const uploadedFiles = [];

    for (const field of ['photo', 'aadharcard', 'pancard', 'incomeTaxReturn', 'creditReport']) {
      if (req.files?.[field]) {
        const files = Array.isArray(req.files[field]) ? req.files[field] : [req.files[field]];

        for (const file of files) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: `loan_applications/${applicationId}/${field}`
          });

          uploadedFiles.push({
            name: field,
            url: result.secure_url,
            type: file.mimetype
          });
        }
      }
    }

    await LoanApplication.findByIdAndUpdate(applicationId, {
      $push: { documents: { $each: uploadedFiles } }
    });

    res.status(200).json({ message: 'Files uploaded', uploaded: uploadedFiles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
};

export const getAllLoanApplicationsService = async (role, userId) => {
  try {
    let query = {};

    if (role === 'subAgent') {
      query.createdBy = userId;
    } else if (role === 'agent') {
      query.agentId = userId;
    } else if (role === 'admin'){
      query.adminIds = userId;
    }else if (role === 'bankOperator') {
      const user = await User.findById(userId);
      if (user && user.branches?.length > 0) {
        query['bankData.branches.branchId'] = { $in: user.branches };
      } else {
        return []; // No branches assigned, return empty
      }
    }

    const applications = await LoanApplication.find(query)
      .populate('userId', 'fullName email')
      .populate('agentId', 'fullName')
      .populate('bankData.bankId', 'bankName')
      .populate('bankData.branches.branchId', 'branchName bankLocation');

    return applications;
  } catch (error) {
    throw new Error('Error fetching visible applications: ' + error.message);
  }
};


// Get loan application by ID
export const getLoanApplicationById = async (id) => {
    try {
        const application = await LoanApplication.findById(id)
            // .populate('userId', 'id')
            // .populate('agentId', 'id')
            // .populate('bankId', 'name')
            // .populate('branchId', 'name location')
            // .populate('criteriaValues.criteriaId', 'criteriaName');
        if (!application) {
            throw new Error('Loan application not found');
        }
        return application;
    } catch (error) {
        throw new Error('Error fetching loan application: ' + error.message);
    }
};


// Update loan application
export const updateLoanApplicationWithFilesService = async (id, updateData, role, userId) => {
  try {
    const application = await LoanApplication.findById(id);
    if (!application) {
      throw new Error('Loan application not found');
    }

    // Authorization checks
    if (role === 'user' && application.userId.toString() !== userId) {
      throw new Error('Unauthorized: You can only update your own loan applications.');
    }

    if ((role === 'agent' || role === 'subAgent') &&
        application.agentId && application.agentId.toString() !== userId) {
      throw new Error("Unauthorized: You can only update loan applications that you submitted");
    }

    // Status checks
    if (application.status === 'approved') {
      throw new Error('Cannot update an approved loan application.');
    }

    if (application.status === 'rejected' && updateData.status !== 'resubmitted') {
      throw new Error('Only status "resubmitted" is allowed after rejection');
    }

    // Optional: Parse and sanitize bankData if present
    const allowedLoanTypes = new Set();

    if (updateData.data) {
      updateData.bankData = updateData.data.map(bank => ({
        bankId: new mongoose.Types.ObjectId(bank.bankId),
        branches: bank.branches.map(branch => {
          const loanTypesArray = Array.isArray(branch.loanTypes)
            ? branch.loanTypes
            : [branch.loanTypes];

          loanTypesArray.forEach(type => allowedLoanTypes.add(type));

          return {
            branchId: new mongoose.Types.ObjectId(branch.branchId),
            loanTypes: loanTypesArray
          };
        })
      }));

      if (allowedLoanTypes.size > 1) {
        throw new Error('Only one loan type is allowed across all banks/branches.');
      }
    }

    const updatedApplication = await LoanApplication.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('userId', 'id name')
      .populate('agentId', 'id name')
      .populate('bankData.bankId', 'name')
      .populate('bankData.branches.branchId', 'name location')
      .populate('criteriaValues.criteriaId', 'criteriaName');

      let result = null;

    if (updatedApplication.bankData && updatedApplication.bankData.length > 0) {
    result = await fetchBankOperatorFromLoanApplication(updatedApplication);
    console.log(result.operators);
    } else {
    console.warn('⚠️ Skipping bank operator fetch: No bankData present');
    }
  } catch (error) {
    throw new Error('Error updating loan application: ' + error.message);
  }
}

// Get visible loan applications based on user role
// export const updateLoanApplicationService = async (id, updateData, role, userId) => {
//   try {
//     const existing = await LoanApplication.findById(id);
//     if (!existing) throw new Error("Loan application not found");

//     if ((role === 'agent' || role === 'subAgent') && existing.createdBy.toString() !== userId)
//       throw new Error("Unauthorized: You can only update applications you submitted");

//     const updated = await LoanApplication.findByIdAndUpdate(
//       id,
//       { $set: updateData },
//       { new: true, runValidators: true }
//     );

//     return updated;
//   } catch (error) {
//     throw new Error("Error updating loan application: " + error.message);
//   }
// };


export const updateLoanApplicationBranchService = async (id, updateData, role, userId) => {
  try {
    const application = await LoanApplication.findById(id);
    if (!application) throw new Error("Loan application not found");

    // 🛡️ Debug logs
    console.log("🔐 Role:", role);
    console.log("🔐 Requesting User ID:", userId);
    console.log("🔐 Application CreatedBy:", application.createdBy.toString());

    if (role === 'subAgent') {
  const creatorId = application.createdBy?.toString();
  const currentUserId = userId?.toString();

  console.log("📌 creatorId:", creatorId);
  console.log("📌 currentUserId:", currentUserId);

  if (creatorId !== currentUserId) {
    throw new Error("Unauthorized: Only the sub-agent creator can update this application");
  }
}


    if (role === 'agent') {
  const subAgents = await User.find({ createdBy: userId, role: 'subAgent' }).select('_id');
  const subAgentIds = subAgents.map(sa => sa._id.toString());

  const creatorId = application.createdBy.toString();
  const userIdStr = userId.toString();

  console.log("🧾 SubAgent IDs of Agent:", subAgentIds);
  console.log("📌 creatorId:", creatorId);
  console.log("📌 userIdStr:", userIdStr);

  if (creatorId !== userIdStr && !subAgentIds.includes(creatorId)) {
    throw new Error("Unauthorized: You don't have access to this application");
  }
}

    // ✅ Status restrictions
    if (application.status === 'approved') {
      throw new Error("Cannot update bank data on an approved application");
    }

    if (application.status === 'rejected' && updateData.status !== 'resubmitted') {
      throw new Error("Only status 'resubmitted' is allowed after rejection");
    }

    // ✅ Validate input
    if (!Array.isArray(updateData.bankData)) {
      throw new Error("Invalid bank data format");
    }

    // ✅ Prepare and validate loan types
    const allowedLoanTypes = new Set();
    const bankData = updateData.bankData.map(bank => ({
      bankId: new mongoose.Types.ObjectId(bank.bankId),
      branches: bank.branches.map(branch => {
        const loanTypesArray = Array.isArray(branch.loanTypes)
          ? branch.loanTypes
          : [branch.loanTypes];

        loanTypesArray.forEach(type => allowedLoanTypes.add(type));

        return {
          branchId: new mongoose.Types.ObjectId(branch.branchId),
          loanTypes: loanTypesArray
        };
      })
    }));

    if (allowedLoanTypes.size > 1) {
      throw new Error("Only one loan type allowed across all branches");
    }

    // ✅ Update DB
    const updatedApp = await LoanApplication.findByIdAndUpdate(
      id,
      { bankData },
      { new: true, runValidators: true }
    );

    if (updatedApp?.bankData?.length > 0) {
      await fetchBankOperatorFromLoanApplication(updatedApp);
    }

    return updatedApp;

  } catch (err) {
    throw new Error("Error updating bank selection: " + err.message);
  }
};


export const deleteLoanApplication = async (id, role, userId) => {
    try {
        const application = await LoanApplication.findById(id);
        if (!application) {
            throw new Error('Loan application not found');
        }
        //  Authorization check.
        if (role === 'user' && application.userId.toString() !== userId) {
            throw new Error('Unauthorized: You can only delete your own loan applications.');
        }
        if (role === 'agent' || role === 'subAgent') {
            if (application.agentId && application.agentId.toString() !== userId) {
                throw new Error("Unauthorized: You can only delete loan applications that you submitted")
            }
        }

        // Prevent deletion if it is not pending
        if (application.status !== 'pending' && application.status !== 'resubmitted') {
            throw new Error('Cannot delete loan application with status: ' + application.status);
        }

        const deletedApplication = await LoanApplication.findByIdAndDelete(id);
        if (!deletedApplication) {
            throw new Error('Loan application not found'); // Redundant, but kept for consistency
        }
        return { message: 'Loan application deleted successfully' };
    } catch (error) {
        throw new Error('Error deleting loan application: ' + error.message);
    }
};

// Get loan applications by User ID
export const getLoanApplicationsByUserId = async (userId) => {
    try {
        const applications = await LoanApplication.find({ userId: userId })
            .populate('userId', 'id')
            .populate('agentId', 'id')
            .populate('bankId', 'name')
            .populate('branchId', 'name location')
            .populate('criteriaValues.criteriaId', 'criteriaName');
        return applications;
    } catch (error) {
        throw new Error('Error fetching loan applications: ' + error.message);
    }
};

// Get loan applications by Agent ID
export const getLoanApplicationsByAgentId = async (agentRole,agentId) => {
    try {
      if(agentRole?.toLowerCase() == "subagent" ){fetchSubAgentLoanApplication(agentId,agentRole)}
      fetchAgentLoanApplications(agentId); 
      fetchAdminLoanApplications(agentId);
      
        const allSubAgents=await User.find({createdBy:agentId});
        console.log(allSubAgents);
        let subAgentIds=[];
        if(allSubAgents.length>0){
            allSubAgents?.forEach((subAgent)=>{
                subAgentIds.push(subAgent._id);
            })
        }
        subAgentIds.push(agentId);
        console.log(subAgentIds);
        const applications = await LoanApplication.find({ agentId: {$in:subAgentIds} })
            .populate('userId', 'id')
            .populate('agentId', 'id')
            .populate('bankId', 'name')
            .populate('branchId', 'name location')
            .populate('criteriaValues.criteriaId', 'criteriaName');
        // const applications = await LoanApplication.find({ agentId: agentId })
        //     .populate('userId', 'id')
        //     .populate('agentId', 'id')
        //     .populate('bankId', 'name')
        //     .populate('branchId', 'name location')
        //     .populate('criteriaValues.criteriaId', 'criteriaName');
        const loanApplication =await LoanApplication.find()
        return {applications, loanApplication};
    } catch (error) {
        console.log(agentId)
        throw new Error('Error fetching loan applications: ' + error.message);
    }
};

async function fetchSubAgentLoanApplication(id) {
  console.log("SubAgent fetch start");

  try {
    // 1. Find the sub-agent by ID
    const subAgent = await User.findById(id);
    if (!subAgent) {
      throw new Error('SubAgent not found');
    }

    console.log("SubAgent:", subAgent);

    // 2. Fetch loan applications created by this sub-agent
    const applications = await LoanApplication.find({ createdBy: id })
      .populate('userId', 'id name')
      .populate('createdBy', 'id name')  // Show who created it
      .populate('agentId', 'id name')    // Who submitted it
      .populate('bankId', 'name')
      .populate('branchId', 'name location')
      .populate('criteriaValues.criteriaId', 'criteriaName');

    console.log("Applications by sub-agent:", applications);

    console.log("SubAgent fetch end");

    return {
      subAgent,
      applications
    };

  } catch (error) {
    console.error("Error in fetchSubAgentLoanApplication:", error.message);
    throw new Error('Failed to fetch sub-agent loan applications: ' + error.message);
  }
}

export async function fetchAgentLoanApplications(id) {
  console.log("agent start");

  // 1. Find the agent
  const agent = await User.findById(id);
  if (!agent) throw new Error('Agent not found');
  console.log("Agent:", agent);

  // 2. Find subagents created by this agent
  const subAgents = await User.find({ createdBy: id });
  console.log("SubAgents:", subAgents);

  // 3. Collect all agent/subagent IDs for matching
  const agentIds = [id, ...subAgents.map(sa => sa._id)].map(_id => new mongoose.Types.ObjectId(_id));
  console.log("Agent & SubAgent IDs:", agentIds);

  // 4. Fetch loan applications where createdBy is in agentIds
  const applications = await LoanApplication.find({ createdBy: { $in: agentIds } })
    .populate('userId', 'id name')
    .populate('createdBy', 'id name') // optional: if you want to show which agent submitted it
    .populate('bankId', 'name')
    .populate('branchId', 'name location')
    .populate('criteriaValues.criteriaId', 'criteriaName');

  console.log("Applications:", applications);
  console.log("agent end");

  return { agent, subAgents, applications };
}

export async function fetchAdminLoanApplications(id) {
  console.log("admin start");

  // 1. Find the admin
  const admin = await User.findById(id);
  if (!admin) throw new Error('Admin not found');
  console.log("Admin:", admin);

  // 2. Find agents created by this admin
  const agents = await User.find({ createdBy: id });
  console.log("Agents:", agents);

  // 3. Find subagents created by this admin
  const subAgents = await User.find({ createdBy: id });
  console.log("SubAgents:", subAgents);

  // 4. Collect all agent/subagent IDs for matching
const allIds = [
  id,
  ...agents.map(a => a._id),
  ...subAgents.map(sa => sa._id)
];

// Ensure all IDs are `ObjectId` type and unique
const adminIds = Array.from(
  new Set(allIds.map(_id => _id.toString())) // convert to string for uniqueness
).map(strId => new mongoose.Types.ObjectId(strId)); // convert back to ObjectId
  console.log("Admin, Agent & SubAgent IDs:", adminIds);

  // 5. Fetch loan applications where createdBy is in agentIds
  const applications = await LoanApplication.find({ createdBy: { $in: adminIds } })
    .populate('userId', 'id name')
    .populate('createdBy', 'id name') // optional: if you want to show which agent submitted it
    .populate('bankId', 'name')
    .populate('branchId', 'name location')
    .populate('criteriaValues.criteriaId', 'criteriaName');

  console.log("Applications:", applications);
  console.log("admin end");

  return { admin, agents, subAgents, applications };
}

export async function fetchBankOperatorFromLoanApplication(applicationId) {
  console.log("Fetching bank operator for loan application:", applicationId);


  try {
    const application = await LoanApplication.findById(applicationId);
    if (!application) {
      throw new Error("Loan application not found");
    }

    if (!application.bankData || application.bankData.length === 0) {
      throw new Error("Loan application does not contain bank data");
    }

    const bankId = application.bankData[0]?.bankId;
    const branchId = application.bankData[0]?.branches?.[0]?.branchId;

    if (!bankId || !branchId) {
      throw new Error("Missing bankId or branchId in loan application");
    }

    const bankOperators = await User.find({
      role: 'bankOperator',
      bankId: bankId,
      branches: { $in: [branchId] }
    }).select('_id fullName email mobileNumber branches bankId');

    if (bankOperators.length === 0) {
      console.log("⚠️ No bank operators found for this branch");
    }

    return {
      applicationId,
      bankId,
      branchId,
      operators: bankOperators
    };

  } catch (error) {
    console.error("Error in fetchBankOperatorFromLoanApplication:", error.message);
    throw new Error('Failed to fetch bank operator: ' + error.message);
  }
}


// export const processLoanDecision = async ({ loanId, isAccepted, approvedAmount, interestRate, rejectionReason, userId }) => {
//   const app = await LoanApplication.findById(loanId);
//   if (!app) throw new Error('Loan not found');
// console.log(app)
//   // Only bank can act and on pending/resubmitted
//   if (app.status !== 'Pending' && app.status !== 'resubmitted') {
//     throw new Error('Loan not in actionable state');
//   }

//   if (isAccepted) {
//     app.status = 'approved';
//     app.approvedAmount = approvedAmount;
//     app.interestRate = interestRate;
//   } else {
//     app.status = 'rejected';
//     app.rejectionReason = rejectionReason;
//   }

//   app.bankDecisionBy = userId;
//   app.decisionAt = new Date();
//   await app.save();

//   // Notify agent & sub-agent
//   const agentsToNotify = [];
//   if (app.agentId) agentsToNotify.push(app.agentId);
//   if (app.subAgentId) agentsToNotify.push(app.subAgentId);

//   const users = await User.find({ _id: { $in: agentsToNotify } });
//   for (const usr of users) {
//     // Example: add to their notifications array
//     usr.notifications = usr.notifications || [];
//     usr.notifications.push({
//       loanId,
//       type: isAccepted ? 'loan_approved' : 'loan_rejected',
//       message: isAccepted
//         ? `Your loan #${loanId} was approved`
//         : `Your loan #${loanId} was rejected: ${rejectionReason}`,
//       date: new Date(),
//     });
//     await usr.save();
//   }

//   return app;
// };


export const processLoanDecision = async ({ loanId, isAccepted, approvedAmount, interestRate, rejectionReason, userId }) => {
  const app = await LoanApplication.findById(loanId);
  if (!app) throw new Error('Loan not found');

  // Prevent duplicate decision by same bank operator
  const existingDecision = await BankDecision.findOne({ loanId, bankOperatorId: userId });
  if (existingDecision) {
    throw new Error('You have already submitted a decision for this loan');
  }

  const decision = new BankDecision({
    loanId,
    bankOperatorId: userId,
    isAccepted,
    approvedAmount: isAccepted ? approvedAmount : undefined,
    interestRate: isAccepted ? interestRate : undefined,
    rejectionReason: !isAccepted ? rejectionReason : undefined,
  });

  await decision.save();

  // Notify agent & sub-agent
  const agentsToNotify = [];
  if (app.agentId) agentsToNotify.push(app.agentId);
  if (app.subAgentId) agentsToNotify.push(app.subAgentId);

  const users = await User.find({ _id: { $in: agentsToNotify } });
  for (const usr of users) {
    usr.notifications = usr.notifications || [];
    usr.notifications.push({
      loanId,
      type: isAccepted ? 'loan_approved' : 'loan_rejected',
      message: isAccepted
        ? `Bank decision: loan #${loanId} approved`
        : `Bank decision: loan #${loanId} rejected - ${rejectionReason}`,
      date: new Date(),
    });
    await usr.save();
  }

  return decision;
};



