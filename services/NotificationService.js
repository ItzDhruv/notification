const FirebaseProvider = require('../providers/FirebaseProvider');

const OneSignalProvider = require('../providers/OneSignalProvider');
const PusherProvider = require('../providers/PusherProvider');
const providerConfig = require('../config/providerConfig');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.providers = [];
    this.initializeProviders();
  }

  initializeProviders() {
    // Initialize providers based on configuration and enabled status
    const providers = [
      {
        class: FirebaseProvider,
        config: providerConfig.firebase,
        name: 'firebase'
      },
     
      {
        class: OneSignalProvider,
        config: providerConfig.onesignal,
        name: 'onesignal'
      },
      {
        class: PusherProvider,
        config: providerConfig.pusher,
        name: 'pusher'
      }
    ];

    // Create provider instances and sort by priority
    this.providers = providers
      .filter(p => p.config.enabled)
      .map(p => ({
        instance: new p.class(p.config.config, p.config.enabled),
        priority: p.config.priority
      }))
      .sort((a, b) => a.priority - b.priority)
      .map(p => p.instance);

    logger.info(`Initialized ${this.providers.length} notification providers`);
  }

  async sendNotification(notification, options = {}) {
    if (this.providers.length === 0) {
      throw new Error('No notification providers available');
    }

    const results = [];
    const errors = [];
    let sent = false;

    // If specific provider is requested
    if (options.provider) {
      const provider = this.providers.find(p => 
        p.getName().toLowerCase() === options.provider.toLowerCase()
      );
      
      if (!provider) {
        throw new Error(`Provider ${options.provider} not found or not enabled`);
      }

      try {
        const result = await provider.send(notification);
        return result;
      } catch (error) {
        throw new Error(`Failed to send via ${options.provider}: ${error.message}`);
      }
    }

    // Try providers in priority order with failover
    for (const provider of this.providers) {
      if (!provider.isEnabled()) {
        continue;
      }

      try {
        logger.info(`Attempting to send notification via ${provider.getName()}`);
        const result = await provider.send(notification);
        results.push(result);
        sent = true;

        // If failover is disabled, return after first success
        if (!options.enableFailover) {
          break;
        }
      } catch (error) {
        logger.error(`Failed to send via ${provider.getName()}:`, error);
        errors.push({
          provider: provider.getName(),
          error: error.message
        });

        // If this is the last provider and nothing was sent, throw error
        if (provider === this.providers[this.providers.length - 1] && !sent) {
          throw new Error(`All providers failed: ${JSON.stringify(errors)}`);
        }
      }
    }

    return {
      success: sent,
      results: results,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  async sendBulkNotifications(notifications, options = {}) {
    const results = [];

    for (const notification of notifications) {
      try {
        const result = await this.sendNotification(notification, options);
        results.push({
          notification: notification,
          result: result,
          success: true
        });
      } catch (error) {
        results.push({
          notification: notification,
          error: error.message,
          success: false
        });
      }
    }

    return results;
  }

  getAvailableProviders() {
    return this.providers.map(provider => ({
      name: provider.getName(),
      enabled: provider.isEnabled()
    }));
  }

  updateProviderStatus(providerName, enabled) {
    const provider = this.providers.find(p => 
      p.getName().toLowerCase() === providerName.toLowerCase()
    );
    
    if (provider) {
      provider.enabled = enabled;
      logger.info(`Provider ${providerName} ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    }
    
    return false;
  }
}

module.exports = NotificationService;
