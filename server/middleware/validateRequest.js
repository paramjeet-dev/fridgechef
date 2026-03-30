import Joi from 'joi';

/**
 * Returns an Express middleware that validates req.body against a Joi schema.
 * On failure: responds 400 with the first validation error message.
 *
 * Usage:
 *   router.post('/register', validateRequest(registerSchema), authController.register)
 */
export const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, {
    abortEarly: true,      // Return first error only (cleaner UX messages)
    allowUnknown: false,   // Reject unexpected fields
    stripUnknown: true,    // Remove any extra fields from req.body
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message.replace(/['"]/g, ''),
    });
  }

  next();
};

// ── Reusable Joi schemas ──────────────────────────────────────

export const registerSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required()
    .messages({ 'string.email': 'Please provide a valid email address' }),
  password: Joi.string().min(8).required()
    .messages({ 'string.min': 'Password must be at least 8 characters' }),
  displayName: Joi.string().min(2).max(50).trim().required()
    .messages({ 'string.min': 'Display name must be at least 2 characters' }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});
