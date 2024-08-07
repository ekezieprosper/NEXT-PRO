const Joi = require("@hapi/joi")

const signUp = (req, res, next) => {
  const validateSignup = Joi.object({
    userName: Joi.string()
      .required().min(8)
       // Regex pattern allowing lowercase letters, numbers, underscore, and hyphen
      .pattern(new RegExp('^[a-z0-9_.-]+$'))
      .messages({
        'string.base': 'Username must be a string',
        'string.empty': 'Username cannot be empty',
        'string.min': 'userame must be at least {#limit} characters long',
        'string.pattern.base': 'Only numbers, hyphens, and underscores can be added if needed',
        'any.required': 'Username is required'
      }),

    email: Joi.string().email().required().messages({
      'string.base': 'Email must be a string',
      'string.empty': 'Email cannot be empty',
      'string.email': 'Invalid email address',
      'any.required': 'Email is required'
    }),

    password: Joi.string().required().pattern(new RegExp('^(?=.*[a-zA-Z])(?=.*[\\d@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')).messages({
      'string.base': 'Password must be a string',
      'string.empty': 'Password cannot be empty',
      'string.pattern.base': 'Password must be at least 8 characters long, include at least one letter, and contain at least one number or special character.',
      'any.required': 'Password is required'
    }),
    

    gender: Joi.string().required().min(4).max(6).messages({
      'string.base': 'gender must be a number',
      'string.min': 'gender must be minimum of {#limit} characters',
      'string.max': 'gender must be maximum of {#limit} characters',
    })
  })

  const {userName, email, password, gender } = req.body

  const { error } = validateSignup.validate({userName,gender,email,password}, { abortEarly: false })
  if (error) {
    const errors = error.details.map(detail => detail.message)
    
    // Send errors one by one
    for (const errorMessage of errors) {
    return res.status(400).json({ error: errorMessage })
    }
  }

  next()
}


const updateValidation = (req, res, next) => {
  const validateUpdate = Joi.object({
   
name: Joi.string().min(3).max(50).allow('').messages({
  'string.base': 'Name must be a string',
  'string.min': 'Name must be at least {#limit} characters long',
  'string.max': 'Name cannot be longer than {#limit} characters',
}),

Birthday: Joi.string().allow('')
.pattern(/^\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/)
.messages({
  'string.base': '"Birthday" must be a string',
  'string.pattern.base': '"Birthday" must be in the format "21 August 2006"',
}),

phoneNumber: Joi.string().allow('')
.pattern(/^\+?\d{1,4}[\s.-]?\(?\d+\)?[\d\s.-]*$/)
.messages({
  'string.base': 'phoneNumber must be a string',
  'string.pattern.base': 'phoneNumber is not valid',
  })
})

  const { name, Birthday, phoneNumber} = req.body

  const { error } = validateUpdate.validate({name,Birthday, phoneNumber})
  if (error) {
    const errors = error.details.map(detail => detail.message)
    
    // Send errors one by one
    for (const errorMessage of errors) {
    return res.status(400).json({ error: errorMessage })
    }
  }

  next()
}


const forgotValidation = (req, res, next) => {
  const validateforgot = Joi.object({
    email: Joi.string().email().required().messages({
      'string.base': 'Email must be a string',
      'string.empty': 'Email cannot be empty',
      'string.email': 'Invalid email address',
      'any.required': 'Email is required'
    })
  })

  const { email } = req.body

  const { error } = validateforgot.validate({email})
  if (error) {
    return res.status(400).json({
      error: error.details.map(detail => detail.message), 
    })
  }

  next()
}

// password: Joi.string().required().pattern(new RegExp('^(?=.*[a-zA-Z])(?=.*[\\d@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')).messages({
//   'string.base': 'Password must be a string',
//   'string.empty': 'Password cannot be empty',
//   'string.pattern.base': 'Password must be at least 8 characters long, include at least one letter, and contain at least one number or special character.',
//   'any.required': 'Password is required'
// }),


const resetPasswordValidation = (req, res, next) => {
  const validatePassword = Joi.object({
    newPassword: Joi.string().required().pattern(new RegExp('^(?=.*[a-zA-Z])(?=.*[\\d@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')).messages({
      'string.base': 'Password must be a string',
      'string.empty': 'Password cannot be empty',
      'string.pattern.base': 'Password must be at least 8 characters long, include at least one letter, and contain at least one number or special character.',
      'any.required': 'Password is required'
    }),
  })

  const { newPassword } = req.body

  const { error } = validatePassword.validate({newPassword})
  if (error) {
    const errors = error.details.map(detail => detail.message)
    
    // Send errors one by one
    for (const errorMessage of errors) {
    return res.status(400).json({ error: errorMessage })
    }
  }

  next()
}


const changePasswordValidation = (req, res, next) => {
  const changePassword = Joi.object({
    currentPassword:  Joi.string().required().pattern(new RegExp('^(?=.*[a-zA-Z])(?=.*[\\d@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')).messages({
      'string.base': 'Password must be a string',
      'string.empty': 'Password cannot be empty',
      'string.pattern.base': 'Password must be at least 8 characters long, include at least one letter, and contain at least one number or special character.',
      'any.required': 'Password is required'
    }),
    newPassword:  Joi.string().required().pattern(new RegExp('^(?=.*[a-zA-Z])(?=.*[\\d@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')).messages({
      'string.base': 'Password must be a string',
      'string.empty': 'Password cannot be empty',
      'string.pattern.base': 'Password must be at least 8 characters long, include at least one letter, and contain at least one number or special character.',
      'any.required': 'Password is required'
    }),  
  })

  const { currentPassword, newPassword } = req.body

  const { error } = changePassword.validate({currentPassword,newPassword})

  if (error) {
    const errors = error.details.map(detail => detail.message)
    
    // Send errors one by one
    for (const errorMessage of errors) {
    return res.status(400).json({ error: errorMessage })
    }
  }

  next()
}

module.exports = {signUp, updateValidation, forgotValidation,changePasswordValidation, resetPasswordValidation}
