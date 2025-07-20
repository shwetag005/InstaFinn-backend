export const parseMultipartLoanApplication = (req, res, next) => {
  if (!req.is('multipart/form-data')) {
    return next();
  }

  const jsonFields = [
    'personalInfo',
    'familyInfo',
    'employmentInfo',
    'loanDetails',
    'propertyInvestment',
    'bankData',
    'references',
    'criteriaValues',
    'documents'
  ];

  const fileFields = [
    'photo',
    'aadharcard',
    'pancard',
    'incomeTaxReturn',
    'creditReport'
  ];

  // Parse expected JSON fields
  jsonFields.forEach(field => {
    if (req.body[field]) {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch (error) {
        return res.status(400).json({ message: `Invalid JSON in field ${field}` });
      }
    }
  });

  // Clean up file fields from body
  fileFields.forEach(field => {
    if (
      field in req.body &&
      (req.body[field] === '' || (typeof req.body[field] === 'object' && Object.keys(req.body[field]).length === 0))
    ) {
      delete req.body[field];
    }
  });

  next();
};
