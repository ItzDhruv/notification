const NotificationService = require('./services/NotificationService');
const providerConfig = require('./config/providerConfig');
const FirebaseProvider = require('./providers/FirebaseProvider');
const OneSignalProvider = require('./providers/OneSignalProvider');
const PusherProvider = require('./providers/PusherProvider');

// Export a service instance (for failover/multi-provider use)
const service = new NotificationService();

// Export individual providers (for direct use)
const firebase = new FirebaseProvider(providerConfig.firebase.config, providerConfig.firebase.enabled);
const onesignal = new OneSignalProvider(providerConfig.onesignal.config, providerConfig.onesignal.enabled);
const pusher = new PusherProvider(providerConfig.pusher.config, providerConfig.pusher.enabled);

module.exports = {
  service,
  firebase,
  onesignal,
  pusher
};
