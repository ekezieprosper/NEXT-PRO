const Joi = require('@hapi/joi')

const playerValidation = (req, res, next) => {
  const validation = Joi.object({
    userName: Joi.string()
      .required().min(8)
       // Regex pattern allowing lowercase letters, numbers, underscore, and hyphen
      .pattern(new RegExp('^[a-z0-9_.-]+$'))
      .messages({
        'string.base': 'Username must be a string',
        'string.empty': 'Username is required',
        'string.min': 'Name must be at least {#limit} characters long',
        'string.pattern.base': 'Username must contain only lowercase letters, numbers, underscores, and hyphens',
        'any.required': 'Username is required'
      }),

    name: Joi.string().min(3).max(30).required().messages({
      'string.base': 'Name must be a string',
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least {#limit} characters long',
      'string.max': 'Name cannot be longer than {#limit} characters',
      'any.required': 'Name is required'
    }),

    email: Joi.string().email().required().messages({
      'string.base': 'Email must be a string',
      'string.empty': 'Email is required',
      'string.email': 'Invalid email address',
      'any.required': 'Email is required'
    }),

    phoneNumber: Joi.string().pattern(new RegExp('^[0-9]{11}$')).required().messages({
      'string.base': 'Phone number must be a string',
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Phone number must be a valid 11-digit number',
      'any.required': 'Phone number is required'
    }),

    password: Joi.string().required().min(8).max(30).messages({
      'string.base': 'Password must be a string',
      'string.empty': 'Password is required',
      'string.min': 'Password must be a minimum of {#limit} characters',
      'string.max': 'Password must be a maximum of {#limit} characters',
      'any.required': 'Password is required'
    }),

    gender: Joi.string().required().min(4).max(6).messages({
      'string.base': 'gender must be a number',
      'string.min': 'gender must be minimum of {#limit} characters',
      'string.max': 'gender must be maximum of {#limit} characters',
    }),

    Birthday: Joi.string().pattern(new RegExp("^\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$")).required().messages({
      'string.base': 'Birthday must be a string',
      'string.empty': 'Birthday is required',
      'string.pattern.base': 'Birthday must have days, month, and year',
      'any.required': 'Birthday is required'
    }),
  })

  const { userName, name, age, gender, phoneNumber, password, Birthday, email } = req.body
  const { error } = validation.validate({ userName, name, age, gender, phoneNumber, password, Birthday, email }, { abortEarly: false })
  if (error) {
    return res.status(400).json({
      error: error.message
    })
  }
  next()
}

module.exports = playerValidation
