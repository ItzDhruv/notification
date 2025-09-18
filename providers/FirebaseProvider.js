const admin = require('firebase-admin');
const BaseProvider = require('./BaseProvider');
const logger = require('../utils/logger');

class FirebaseProvider extends BaseProvider {
  constructor(config, enabled) {
    super('Firebase', config, enabled);
    this.initialized = false;
    this.init();
  }

  init() {
    try {
      if (!this.enabled) {
        logger.info('Firebase provider is disabled');
        return;
      }

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(this.config)
        });
      }
      this.initialized = true;
      logger.info('Firebase provider initialized successfully');
    } catch (error) {
      logger.error('Firebase initialization error:', error);
      this.enabled = false;
    }
  }

  async send(notification) {
    if (!this.enabled || !this.initialized) {
      throw new Error('Firebase provider is not available');
    }

    try {
      this.validateNotification(notification);

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          image: notification.image
        },
        data: notification.data || {},
        android: notification.android || {},
        apns: notification.apns || {},
        webpush: notification.webpush || {}
      };

      let result;
      if (notification.tokens && Array.isArray(notification.tokens)) {
        message.tokens = notification.tokens;
        result = await admin.messaging().sendMulticast(message);
      } else if (notification.token) {
        message.token = notification.token;
        result = await admin.messaging().send(message);
      } else if (notification.topic) {
        message.topic = notification.topic;
        result = await admin.messaging().send(message);
      } else {
        throw new Error('No valid target specified (token, tokens, or topic)');
      }

      logger.info('Firebase notification sent successfully', { result });
      return {
        success: true,
        provider: this.name,
        result: result
      };
    } catch (error) {
      logger.error('Firebase send error:', error);
      throw error;
    }
  }
}

module.exports = FirebaseProvider;