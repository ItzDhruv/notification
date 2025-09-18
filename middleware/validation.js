const Joi = require('joi');

const notificationSchema = Joi.object({
  title: Joi.string().required(),
  body: Joi.string().required(),
  image: Joi.string().uri().optional(),
  data: Joi.object().optional(),
  
  // Firebase specific
  token: Joi.string().optional(),
  tokens: Joi.array().items(Joi.string()).optional(),
  topic: Joi.string().optional(),
  android: Joi.object().optional(),
  apns: Joi.object().optional(),
  webpush: Joi.object().optional(),
  
  // Twilio specific
 
  
  // OneSignal specific
  playerIds: Joi.array().items(Joi.string()).optional(),
  segments: Joi.array().items(Joi.string()).optional(),
  
  // Pusher specific
  channel: Joi.string().optional(),
  event: Joi.string().optional()
});

const optionsSchema = Joi.object({
  provider: Joi.string().valid('firebase', 'onesignal', 'pusher').optional(),
  enableFailover: Joi.boolean().default(true),
  timeout: Joi.number().positive().optional()
});

const singleNotificationSchema = Joi.object({
  notification: notificationSchema.required(),
  options: optionsSchema.optional()
});

const bulkNotificationSchema = Joi.object({
  notifications: Joi.array().items(notificationSchema).min(1).max(100).required(),
  options: optionsSchema.optional()
});

const validateNotification = (req, res, next) => {
  const { error } = singleNotificationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.details[0].message
    });
  }
  next();
};

const validateBulkNotification = (req, res, next) => {
  const { error } = bulkNotificationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.details[0].message
    });
  }
  next();
};

module.exports = {
  validateNotification,
  validateBulkNotification
};