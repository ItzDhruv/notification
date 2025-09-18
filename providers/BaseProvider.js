class BaseProvider {
  constructor(name, config, enabled = true) {
    this.name = name;
    this.config = config;
    this.enabled = enabled;
  }

  async send(notification) {
    throw new Error('Send method must be implemented by provider');
  }

  isEnabled() {
    return this.enabled;
  }

  getName() {
    return this.name;
  }

  validateNotification(notification) {
    if (!notification.title && !notification.body) {
      throw new Error('Notification must have either title or body');
    }
    return true;
  }
}

module.exports = BaseProvider;
