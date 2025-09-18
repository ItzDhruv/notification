const Pusher = require('pusher');
const BaseProvider = require('./BaseProvider');
const logger = require('../utils/logger');

class PusherProvider extends BaseProvider {
  constructor(config, enabled) {
    super('Pusher', config, enabled);
    if (enabled) {
      this.pusher = new Pusher({
        appId: config.appId,
        key: config.key,
        secret: config.secret,
        cluster: config.cluster,
        useTLS: true
      });
    }
  }

  async send(notification) {
    if (!this.enabled) throw new Error('Pusher provider is disabled');

    this.validateNotification(notification);

    const channel = notification.channel || 'notifications';
    const event = notification.event || 'new-notification';
    const payload = {
      title: notification.title,
      body: notification.body,
      ...notification.data
    };

    try {
      const result = await this.pusher.trigger(channel, event, payload);
      logger.info('Pusher notification sent successfully', { result });
      return { success: true, provider: this.name, result };
    } catch (err) {
      logger.error('Pusher send error', err);
      throw new Error(`Failed to send via pusher: ${err.message}`);
    }
  }
}

module.exports = PusherProvider;
