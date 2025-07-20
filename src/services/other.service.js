import LoanApplication from '../models/loanApplication.model';

// Service to get loan application status based on user role
const status = [
  { id: 0, key: "new", status: "New Applications", count: 0 },
  { id: 1, key: "pending", status: "Pending Applications", count: 0 },
  { id: 2, key: "inprogress", status: "In Progress Applications", count: 0 },
  { id: 3, key: "rejected", status: "Rejected Applications", count: 0 },
  { id: 4, key: "completed", status: "Completed Applications", count: 0 }
];

export const getLoanApplicationStatus = async (userId, role) => {
  try {
    let applications = [];

    if (role === 'user') {
      applications = await LoanApplication.find({ userId }).select('status');
    } else if (role === 'agent' || role === 'subAgent') {
      applications = await LoanApplication.find({ agentId: userId }).select('status');
    } else if (role === 'admin' || role === 'masterAdmin' || role === 'bankOperator') {
      applications = await LoanApplication.find().select('status');
    } else {
      throw new Error('Unauthorized: Invalid role');
    }

    // Reset counts to 0 before counting
    status.forEach(s => s.count = 0);

    // Count each application's status
    applications.forEach(app => {
      console.log(app)
      const match = status.find(s => s.key?.toLowerCase() === app.status?.toLowerCase());
      console.log(match)
      if (match) {
        match.count += 1;
      }
    });

    return status;
  } catch (error) {
    throw new Error('Error retrieving loan application status: ' + error.message);
  }
};

