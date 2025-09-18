const express = require('express');
const NotificationService = require('../services/NotificationService');
const { validateNotification, validateBulkNotification } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();
const notificationService = new NotificationService();

// Send single notification
router.post('/send', validateNotification, async (req, res) => {
  try {
    const { notification, options = {} } = req.body;
    
    logger.info('Received notification request', { 
      provider: options.provider,
      hasFailover: options.enableFailover 
    });

    const result = await notificationService.sendNotification(notification, options);
    
    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to send notification:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
});

// Send bulk notifications
router.post('/send/bulk', validateBulkNotification, async (req, res) => {
  try {
    const { notifications, options = {} } = req.body;
    
    logger.info('Received bulk notification request', { 
      count: notifications.length,
      provider: options.provider 
    });

    const results = await notificationService.sendBulkNotifications(notifications, options);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    res.status(200).json({
      success: true,
      message: `Bulk notification completed: ${successCount} sent, ${failureCount} failed`,
      data: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        results: results
      }
    });
  } catch (error) {
    logger.error('Failed to send bulk notifications:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to send bulk notifications',
      error: error.message
    });
  }
});

// Get available providers
router.get('/providers', (req, res) => {
  try {
    const providers = notificationService.getAvailableProviders();
    
    res.status(200).json({
      success: true,
      data: providers
    });
  } catch (error) {
    logger.error('Failed to get providers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get providers',
      error: error.message
    });
  }
});

// Update provider status
router.patch('/providers/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Enabled field must be a boolean'
      });
    }
    
    const updated = notificationService.updateProviderStatus(name, enabled);
    
    if (updated) {
      res.status(200).json({
        success: true,
        message: `Provider ${name} ${enabled ? 'enabled' : 'disabled'} successfully`
      });
    } else {
      res.status(404).json({
        success: false,
        message: `Provider ${name} not found`
      });
    }
  } catch (error) {
    logger.error('Failed to update provider status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update provider status',
      error: error.message
    });
  }
});

module.exports = router;

