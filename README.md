# Multi-Provider Notification Service

A robust Node.js notification service that supports multiple providers (Firebase, OneSignal, Pusher) with automatic failover, scheduling, and bulk operations.

## Features

- **Multi-Provider Support**: Firebase FCM, OneSignal, and Pusher
- **Automatic Failover**: Seamlessly switches between providers if one fails
- **Scheduling**: Send notifications at specific times with timezone support
- **Bulk Operations**: Send multiple notifications efficiently
- **Rate Limiting**: Built-in protection against spam
- **Validation**: Comprehensive input validation with detailed error messages
- **Logging**: Structured logging with Winston
- **RESTful API**: Complete REST API with Express.js
- **Type Safety**: Joi schema validation for all inputs

## Installation

```bash
npm install @dhruvdobariya/notification-service
```

## Quick Start

### Environment Setup

Create a `.env` file with your provider credentials:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id

# OneSignal Configuration
ONESIGNAL_APP_ID=your-onesignal-app-id
ONESIGNAL_REST_API_KEY=your-onesignal-rest-api-key

# Pusher Configuration
PUSHER_APP_ID=your-pusher-app-id
PUSHER_KEY=your-pusher-key
PUSHER_SECRET=your-pusher-secret
PUSHER_CLUSTER=your-pusher-cluster

# Provider Preferences
FIREBASE_ENABLED=true
ONESIGNAL_ENABLED=true
PUSHER_ENABLED=true
```

### Basic Usage

```javascript
const {
  firebase,
  onesignal,
  pusher,
  service,
  utils
} = require('@dhruvdobariya/notification-service');

// Send via specific provider
await firebase.send({
  title: "Welcome!",
  body: "Thank you for joining our service",
  token: "firebase-device-token"
});

// Send with automatic failover
await service.sendNotification({
  title: "Important Update",
  body: "New features are now available",
  token: "firebase-token",
  playerIds: ["onesignal-player-id"],
  channel: "updates"
});
```

### Express Server Setup

```javascript
const express = require('express');
const notificationRoutes = require('@dhruvdobariya/notification-service/routes/notificationRoutes');

const app = express();
app.use(express.json());
app.use('/api/notifications', notificationRoutes);

app.listen(3000, () => {
  console.log('Notification service running on port 3000');
});
```

## API Endpoints

### Send Immediate Notification

```bash
POST /api/notifications/send
```

```json
{
  "notification": {
    "title": "Welcome!",
    "body": "Thank you for joining our service",
    "image": "https://example.com/image.jpg",
    "data": { "type": "welcome", "userId": "123" },
    "token": "firebase-token",
    "playerIds": ["onesignal-player-id"],
    "channel": "user-notifications"
  },
  "options": {
    "provider": "firebase",
    "enableFailover": true
  }
}
```

### Schedule Notification

```json
{
  "notification": {
    "title": "Daily Reminder",
    "body": "Don't forget to check your dashboard!"
  },
  "schedule": {
    "time": "09:00",
    "timezone": "America/New_York",
    "frequency": "daily"
  }
}
```

### Send Bulk Notifications

```bash
POST /api/notifications/send/bulk
```

```json
{
  "notifications": [
    {
      "title": "Notification 1",
      "body": "First message",
      "token": "firebase-token-1"
    },
    {
      "title": "Notification 2",
      "body": "Second message",
      "token": "firebase-token-2"
    }
  ]
}
```

### Provider Management

```bash
# Get available providers
GET /api/notifications/providers

# Enable/disable provider
PATCH /api/notifications/providers/firebase
{
  "enabled": false
}
```

### Scheduled Jobs Management

```bash
# Get all scheduled jobs
GET /api/notifications/scheduled

# Get specific job
GET /api/notifications/scheduled/{jobId}

# Cancel scheduled job
DELETE /api/notifications/scheduled/{jobId}
```

### Validation

```bash
POST /api/notifications/validate
```

```json
{
  "notification": {
    "title": "Test",
    "body": "Test message",
    "token": "firebase-token"
  }
}
```

## Notification Schema

### Basic Structure

```javascript
{
  title: "Required - Notification title (max 200 chars)",
  body: "Required - Notification body (max 2000 chars)",
  image: "Optional - Image URL",
  data: { /* Optional - Custom data object */ }
}
```

### Provider-Specific Fields

#### Firebase
```javascript
{
  token: "Single device token",
  tokens: ["array", "of", "device", "tokens"], // Max 500
  topic: "topic-name",
  android: { /* Android-specific options */ },
  apns: { /* iOS-specific options */ },
  webpush: { /* Web push options */ }
}
```

#### OneSignal
```javascript
{
  playerIds: ["player-id-1", "player-id-2"], // Max 2000
  segments: ["All", "Active Users"] // User segments
}
```

#### Pusher
```javascript
{
  channel: "channel-name", // Default: "notifications"
  event: "event-name" // Default: "new-notification"
}
```

## Programmatic Usage

### Individual Providers

```javascript
const { firebase, onesignal, pusher } = require('@dhruvdobariya/notification-service');

// Firebase
const firebaseResult = await firebase.send({
  title: "Firebase Notification",
  body: "Sent via Firebase FCM",
  token: "device-token"
});

// OneSignal
const onesignalResult = await onesignal.send({
  title: "OneSignal Notification",
  body: "Sent via OneSignal",
  playerIds: ["player-id"]
});

// Pusher
const pusherResult = await pusher.send({
  title: "Pusher Notification",
  body: "Sent via Pusher",
  channel: "user-updates"
});
```

### Unified Service

```javascript
const { service } = require('@dhruvdobariya/notification-service');

// Send with automatic failover
const result = await service.sendNotification({
  title: "Multi-Provider Notification",
  body: "Will try providers in priority order",
  token: "firebase-token",
  playerIds: ["onesignal-player-id"],
  channel: "pusher-channel"
});

// Bulk sending
const bulkResult = await service.sendBulkNotifications([
  { title: "Bulk 1", body: "Message 1", token: "token1" },
  { title: "Bulk 2", body: "Message 2", token: "token2" }
]);

// Get provider status
const providers = service.getAvailableProviders();
console.log(providers);
```

### Utility Functions

```javascript
const { utils } = require('@dhruvdobariya/notification-service');

// Check configuration
const configStatus = utils.getConfiguredProviders();
console.log(`${configStatus.enabledCount}/${configStatus.totalProviders} providers configured`);

// Validate environment
const envValidation = utils.validateEnvironment();
if (!envValidation.valid) {
  console.error('Missing env vars:', envValidation.missing);
}
```

## Scheduling

### Time Formats
- **Time**: 24-hour format (HH:MM), e.g., "09:30", "14:15"
- **Timezone**: IANA timezone names, e.g., "America/New_York", "Europe/London"
- **Frequency**: "once" (default) or "daily"

### Examples

```javascript
// One-time notification
{
  "schedule": {
    "time": "15:30",
    "timezone": "America/New_York",
    "frequency": "once"
  }
}

// Daily recurring notification
{
  "schedule": {
    "time": "09:00",
    "timezone": "UTC",
    "frequency": "daily"
  }
}
```

## Error Handling

The service provides comprehensive error handling with detailed error messages:

```javascript
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "notification.title",
      "message": "\"title\" is required",
      "value": undefined
    }
  ]
}
```

## Logging

Structured logging with Winston:

- **Error logs**: `logs/error.log`
- **Combined logs**: `logs/combined.log`
- **Notification logs**: `logs/notifications.log`

## Rate Limiting

Built-in rate limiting (100 requests per 15 minutes per IP) to prevent abuse.

## Security

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Input validation**: Joi schema validation
- **Error sanitization**: Prevents sensitive data leakage

## Health Check

```bash
GET /health
```

Returns service status and scheduler information.

## Provider Priority

Providers are attempted in this order:
1. Firebase (priority 1)
2. OneSignal (priority 2)
3. Pusher (priority 3)

The service stops on the first successful delivery.

## Requirements

- Node.js 14+
- Active accounts with desired providers
- Valid environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and support:
- GitHub Issues: [Create an issue](https://github.com/dhruvdobariya/notification-service/issues)
- Documentation: Check the `/docs` folder for detailed guides
- Examples: See `/examples` folder for implementation examples

## Changelog

### v1.0.0
- Initial release with multi-provider support
- Firebase, OneSignal, and Pusher integration
- Scheduling and bulk operations
- RESTful API with validation

---

**Author**: Dhruv Dobariya  
**Version**: 3.0.0 
**Keywords**: notification, push, firebase, onesignal, pusher, scheduling, multi-provider
#   n o t i f i c a t i o n  
 