const FirebaseProvider = require('./providers/FirebaseProvider');

const OneSignalProvider = require('./providers/OneSignalProvider');
const PusherProvider = require('./providers/PusherProvider');
const NotificationService = require('./services/NotificationService');

// Initialize providers with environment variables
const firebase = new FirebaseProvider({
  project_id: process.env.FIREBASE_PROJECT_ID,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
}, !!process.env.FIREBASE_PROJECT_ID);



const onesignal = new OneSignalProvider({
  appId: process.env.ONESIGNAL_APP_ID,
  restApiKey: process.env.ONESIGNAL_REST_API_KEY
}, !!(process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_REST_API_KEY));

const pusher = new PusherProvider({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER
}, !!(process.env.PUSHER_APP_ID && process.env.PUSHER_KEY));

// Initialize unified service
const service = new NotificationService([firebase, onesignal, pusher]);

// Export individual providers and unified service
module.exports = {
  // Individual providers
  firebase: {
    send: async (notification) => {
      try {
        return await firebase.send(notification);
      } catch (error) {
        throw new Error(`Firebase send failed: ${error.message}`);
      }
    },
    isEnabled: () => firebase.isEnabled()
  },
  
  
  onesignal: {
    send: async (notification) => {
      try {
        return await onesignal.send(notification);
      } catch (error) {
        throw new Error(`OneSignal send failed: ${error.message}`);
      }
    },
    isEnabled: () => onesignal.isEnabled()
  },
  
  pusher: {
    send: async (notification) => {
      try {
        return await pusher.send(notification);
      } catch (error) {
        throw new Error(`Pusher send failed: ${error.message}`);
      }
    },
    isEnabled: () => pusher.isEnabled()
  },
  
  // Unified service with failover
  service: {
    sendNotification: async (notification, options = {}) => {
      try {
        return await service.sendNotification(notification, options);
      } catch (error) {
        throw new Error(`Unified service failed: ${error.message}`);
      }
    },
    
    sendBulkNotifications: async (notifications, options = {}) => {
      try {
        return await service.sendBulkNotifications(notifications, options);
      } catch (error) {
        throw new Error(`Bulk send failed: ${error.message}`);
      }
    },
    
    getAvailableProviders: () => service.getAvailableProviders(),
    
    validateNotification: (notification) => service.validateNotificationForProviders(notification)
  },
  
  // Utility functions
  utils: {
    // Check which providers are properly configured
    getConfiguredProviders: () => {
      const providers = {
        firebase: firebase.isEnabled(),
       
        onesignal: onesignal.isEnabled(),
        pusher: pusher.isEnabled()
      };
      
      const enabledCount = Object.values(providers).filter(Boolean).length;
      
      return {
        providers,
        enabledCount,
        totalProviders: 4,
        allConfigured: enabledCount === 4
      };
    },
    
    // Validate environment variables
    validateEnvironment: () => {
      const missing = [];
      const warnings = [];
      
      // Firebase validation
      if (!process.env.FIREBASE_PROJECT_ID) missing.push('FIREBASE_PROJECT_ID');
      if (!process.env.FIREBASE_CLIENT_EMAIL) missing.push('FIREBASE_CLIENT_EMAIL');
      if (!process.env.FIREBASE_PRIVATE_KEY) missing.push('FIREBASE_PRIVATE_KEY');
      
   
      
      // OneSignal validation
      if (!process.env.ONESIGNAL_APP_ID) warnings.push('ONESIGNAL_APP_ID');
      if (!process.env.ONESIGNAL_REST_API_KEY) warnings.push('ONESIGNAL_REST_API_KEY');
      
      // Pusher validation
      if (!process.env.PUSHER_APP_ID) warnings.push('PUSHER_APP_ID');
      if (!process.env.PUSHER_KEY) warnings.push('PUSHER_KEY');
      if (!process.env.PUSHER_SECRET) warnings.push('PUSHER_SECRET');
      if (!process.env.PUSHER_CLUSTER) warnings.push('PUSHER_CLUSTER');
      
      return {
        valid: missing.length === 0,
        missing,
        warnings,
        message: missing.length > 0 
          ? `Missing required environment variables: ${missing.join(', ')}` 
          : 'Environment validation passed'
      };
    }
  },
  
  // Version and info
  version: require('./package.json').version || '1.1.3',
  author: 'Dhruv Dobariya',
  
  // Provider classes for advanced usage
  providers: {
    FirebaseProvider,
    OneSignalProvider,
    PusherProvider
  },
  
  // Service class for advanced usage
  NotificationService
};

// Optional: Log initialization status when package is imported
if (process.env.NODE_ENV !== 'production') {
  const configStatus = module.exports.utils.getConfiguredProviders();
  console.log(`📦 @dhruvdobariya/notification-provider v${module.exports.version}`);
  console.log(`✅ Configured providers: ${configStatus.enabledCount}/${configStatus.totalProviders}`);
  
  Object.entries(configStatus.providers).forEach(([name, enabled]) => {
    console.log(`   ${enabled ? '✅' : '❌'} ${name}`);
  });
}