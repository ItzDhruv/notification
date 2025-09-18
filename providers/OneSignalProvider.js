const axios = require('axios');
const BaseProvider = require('./BaseProvider');
const logger = require('../utils/logger');

class OneSignalProvider extends BaseProvider {
  constructor(config, enabled) {
    super('OneSignal', config, enabled);
    this.baseUrl = 'https://onesignal.com/api/v1';
  }

  async send(notification) {
    if (!this.enabled) {
      throw new Error('OneSignal provider is not available');
    }

    try {
      this.validateNotification(notification);

      const payload = {
        app_id: this.config.appId,
        headings: { en: notification.title },
        contents: { en: notification.body },
        data: notification.data || {}
      };

      if (notification.playerIds) {
        payload.include_player_ids = notification.playerIds;
      } else if (notification.segments) {
        payload.included_segments = notification.segments;
      } else {
        payload.included_segments = ['All'];
      }

      if (notification.image) {
        payload.big_picture = notification.image;
        payload.large_icon = notification.image;
      }

      const response = await axios.post(
        `${this.baseUrl}/notifications`,
        payload,
        {
          headers: {
            'Authorization': `Basic ${this.config.restApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('OneSignal notification sent successfully', { response: response.data });
      return {
        success: true,
        provider: this.name,
        result: response.data
      };
    } catch (error) {
      logger.error('OneSignal send error:', error);
      throw error;
    }
  }
}

module.exports = OneSignalProvider;
