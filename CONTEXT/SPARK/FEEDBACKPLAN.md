# User Feedback & Analytics Plan

## Overview
Implement a comprehensive user feedback and analytics system using Google Firestore to gather insights, improve user experience, and track usage patterns across all sparks.

## Core Features

### 1. User Rating System
- **5-star rating system** for each spark
- **Optional text feedback** for detailed comments
- **Quick feedback buttons** (thumbs up/down, emoji reactions)
- **Session-based ratings** (rate after completing a spark session)

### 2. Usage Analytics
- **Spark engagement metrics**
  - Time spent in each spark
  - Completion rates
  - Return usage frequency
  - Most/least popular sparks
- **User behavior tracking**
  - Navigation patterns
  - Feature usage (settings, customizations)
  - Error rates and crash reporting
- **Performance metrics**
  - Load times
  - Memory usage
  - Battery impact

### 3. A/B Testing Framework
- **Feature flag system** for testing new functionality
- **Split testing** for UI/UX improvements
- **Gradual rollout** capabilities
- **Real-time switching** without app updates

## Technical Implementation

### Database Schema (Firestore)

#### Users Collection
```typescript
interface User {
  id: string; // Auto-generated user ID
  deviceId: string; // Unique device identifier
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
  preferences: {
    allowsAnalytics: boolean;
    allowsFeedback: boolean;
    notificationsEnabled: boolean;
  };
  demographics?: {
    ageRange?: string;
    region?: string;
    language?: string;
  };
}
```

#### Feedback Collection
```typescript
interface SparkFeedback {
  id: string;
  userId: string;
  sparkId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  sessionDuration: number; // in seconds
  completedActions: string[]; // list of actions completed
  feedbackType: 'rating' | 'quick' | 'detailed';
  timestamp: Timestamp;
  appVersion: string;
  platform: 'ios' | 'android' | 'web';
}
```

#### Analytics Events Collection
```typescript
interface AnalyticsEvent {
  id: string;
  userId: string;
  eventType: 'spark_opened' | 'spark_completed' | 'settings_accessed' | 'error_occurred' | 'feature_used';
  sparkId?: string;
  eventData: {
    [key: string]: any; // Flexible event properties
  };
  timestamp: Timestamp;
  sessionId: string;
  appVersion: string;
  platform: 'ios' | 'android' | 'web';
}
```

#### Feature Flags Collection
```typescript
interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  targetAudience?: {
    platforms?: ('ios' | 'android' | 'web')[];
    appVersions?: string[];
    userSegments?: string[];
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### React Native Implementation

#### Core Services

**FirebaseService.ts**
```typescript
import firestore from '@react-native-firebase/firestore';
import { User, SparkFeedback, AnalyticsEvent, FeatureFlag } from './types';

export class FirebaseService {
  // User management
  static async createUser(userData: Partial<User>): Promise<string>;
  static async updateUser(userId: string, updates: Partial<User>): Promise<void>;
  static async getUser(userId: string): Promise<User | null>;

  // Feedback
  static async submitFeedback(feedback: SparkFeedback): Promise<void>;
  static async getFeedbackForSpark(sparkId: string): Promise<SparkFeedback[]>;
  static async getAggregatedRatings(sparkId: string): Promise<{
    averageRating: number;
    totalRatings: number;
    ratingDistribution: { [rating: number]: number };
  }>;

  // Analytics
  static async logEvent(event: AnalyticsEvent): Promise<void>;
  static async getAnalytics(sparkId?: string, dateRange?: { start: Date; end: Date }): Promise<any>;

  // Feature flags
  static async getFeatureFlags(userId: string): Promise<FeatureFlag[]>;
  static async isFeatureEnabled(flagName: string, userId: string): Promise<boolean>;
}
```

**AnalyticsService.ts**
```typescript
export class AnalyticsService {
  private static sessionId: string = generateSessionId();
  private static userId: string;

  static initialize(userId: string): void;
  static trackSparkOpen(sparkId: string): void;
  static trackSparkComplete(sparkId: string, duration: number, actions: string[]): void;
  static trackError(error: Error, context: string): void;
  static trackFeatureUsage(feature: string, properties?: object): void;
  static setUserProperties(properties: object): void;
}
```

#### UI Components

**FeedbackModal.tsx**
```typescript
interface FeedbackModalProps {
  visible: boolean;
  sparkId: string;
  sessionDuration: number;
  onClose: () => void;
  onSubmit: (feedback: SparkFeedback) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  sparkId,
  sessionDuration,
  onClose,
  onSubmit
}) => {
  // Star rating component
  // Text input for comments
  // Quick reaction buttons
  // Submit/Skip buttons
};
```

**StarRating.tsx**
```typescript
interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
  disabled?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  size = 40,
  disabled = false
}) => {
  // Interactive star rating component
  // Haptic feedback on selection
  // Smooth animations
};
```

#### Integration Points

**Enhanced Spark Components**
- Add feedback triggers to spark completion
- Track time spent in each spark
- Log user interactions and feature usage
- Monitor performance metrics

**Settings Integration**
- Privacy controls for analytics
- Feedback preferences
- Data export options
- Usage statistics display

### Privacy & Compliance

#### Data Privacy Controls
- **Opt-in analytics** with clear explanation
- **Granular permissions** (analytics vs. feedback)
- **Data retention policies** (automatic cleanup after X months)
- **Anonymous mode** option for privacy-conscious users

#### GDPR/CCPA Compliance
- **Data export** functionality
- **Right to deletion** implementation
- **Consent management** system
- **Data minimization** practices

### Implementation Phases

#### Phase 1: Foundation (Week 1-2)
- Set up Firestore project and security rules
- Implement basic user management
- Create core analytics service
- Add privacy controls to settings

#### Phase 2: Feedback System (Week 3-4)
- Build feedback modal and rating components
- Integrate feedback triggers into sparks
- Create admin dashboard for viewing feedback
- Implement feedback aggregation and display

#### Phase 3: Advanced Analytics (Week 5-6)
- Enhanced event tracking
- Performance monitoring
- User segmentation
- Retention analysis

#### Phase 4: Feature Flags & A/B Testing (Week 7-8)
- Feature flag system implementation
- A/B testing framework
- Real-time configuration updates
- Analytics for feature adoption

### Security Considerations

#### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Feedback is write-only for users, read-only for admins
    match /feedback/{feedbackId} {
      allow create: if request.auth != null;
      allow read: if hasAdminRole();
    }

    // Analytics events are write-only
    match /analytics/{eventId} {
      allow create: if request.auth != null;
      allow read: if hasAdminRole();
    }

    // Feature flags are read-only for users
    match /featureFlags/{flagId} {
      allow read: if request.auth != null;
      allow write: if hasAdminRole();
    }
  }
}
```

#### Data Anonymization
- Hash device IDs before storage
- Remove personally identifiable information
- Aggregate data before analysis
- Implement data expiration policies

### Admin Dashboard

#### Web Dashboard Features
- **Real-time analytics** with charts and graphs
- **Feedback management** with filtering and search
- **Feature flag control** with rollout management
- **User insights** and segmentation
- **Export capabilities** for further analysis

#### Key Metrics Dashboard
- Daily/Monthly Active Users
- Spark popularity rankings
- Average session duration
- User retention rates
- Crash reports and error rates
- Feature adoption rates

### Testing Strategy

#### Unit Tests
- Firebase service methods
- Analytics event formatting
- Privacy controls
- Feature flag evaluation

#### Integration Tests
- End-to-end feedback submission
- Analytics event pipeline
- Feature flag distribution
- Performance impact measurement

#### User Testing
- Feedback modal usability
- Privacy controls clarity
- Performance impact assessment
- A/B testing framework validation

### Performance Considerations

#### Optimization Strategies
- **Batch analytics events** to reduce network calls
- **Local caching** of feature flags
- **Lazy loading** of feedback components
- **Background processing** for analytics

#### Monitoring
- Track Firebase quota usage
- Monitor network overhead
- Measure battery impact
- Analyze memory usage

### Success Metrics

#### Engagement Metrics
- **Feedback submission rate** (target: >20% of sessions)
- **Average rating** across all sparks (target: >4.0)
- **User retention** after feedback (target: +15% vs. non-feedback users)

#### Quality Metrics
- **Actionable feedback percentage** (target: >70% useful comments)
- **Response time** to user feedback (target: <48 hours)
- **Feature adoption rate** from A/B tests (target: >5% improvement)

#### Technical Metrics
- **Analytics event reliability** (target: >99% delivery)
- **Performance overhead** (target: <2% additional load time)
- **Data accuracy** (target: >95% event fidelity)

## Next Steps

1. **Set up Firebase project** and configure Firestore
2. **Implement core services** (FirebaseService, AnalyticsService)
3. **Create UI components** (FeedbackModal, StarRating)
4. **Integrate into existing sparks** starting with most popular ones
5. **Build admin dashboard** for monitoring and management
6. **Conduct user testing** and iterate based on feedback
7. **Launch gradually** with feature flags and monitor adoption

This comprehensive feedback and analytics system will provide valuable insights into user behavior, enable data-driven improvements, and create a feedback loop for continuous enhancement of the Sparks app experience.