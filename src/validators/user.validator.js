import Joi from '@hapi/joi';

export const newUserValidator = (req, res, next) => {
  const schema = Joi.object({
      fullName: Joi.string().required(),
      address: Joi.string().required(),
      pin: Joi.string().required(),
      email: Joi.string().email().required(),
      mobileNumber: Joi.string().required()
    role: Joi.string().valid('masterAdmin', 'admin', 'agent', 'subUser', 'bank', 'applicant').required()
    });
  const { error, value } = schema.validate(req.body);
  if (error) {
    next(error);
  } else {
    req.validatedBody = value;
    next();
  }
};
