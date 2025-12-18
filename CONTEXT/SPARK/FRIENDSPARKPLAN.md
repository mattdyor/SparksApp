# Friend Spark Plan

## Overview
**Name:** Friend Spark  
**Tagline:** Connect with friends and share your Sparks  
**Icon:** 👥  
**Category:** Social  
**Difficulty:** High  
**Estimated Time:** 40+ hours  

## Core Concept
A social feature that allows users to connect with friends, send invitations, and share content from other sparks. This enables collaborative and social experiences across the Sparks ecosystem.

## Features

### Phase 1: Core Friend Management

#### 1.1 Authentication Gate
- **Requirement**: User MUST be signed in to use Friend Spark
- **Behavior**: 
  - If not signed in, show sign-in prompt with options:
    - "Sign In with Google" button
    - "Sign In with Apple" button (iOS only)
    - "Leave" button to exit the spark
  - Once signed in, show main Friend Spark interface
- **Implementation**: 
  - Check `AuthService.getCurrentUser()` on spark open
  - Show authentication modal if not signed in
  - Block access to all features until authenticated

#### 1.2 Friend Invitations
- **Create Invitation**:
  - User enters friend's email address
  - System generates unique invitation ID
  - Creates invitation document in Firestore: `friendInvitations/{invitationId}`
  - Sends email notification to recipient
  - Creates notification for recipient (if they're signed in)

- **Invitation Data Structure**:
```typescript
interface FriendInvitation {
  id: string;
  fromUserId: string;
  fromUserEmail: string;
  fromUserName: string;
  toEmail: string;
  toUserId?: string; // Set when recipient signs in
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
  respondedAt?: Timestamp;
}
```

- **Email Notification**:
  - Subject: "[Friend Name] wants to connect on Sparks"
  - Body: Includes invitation link/app deep link
  - Fallback if user hasn't signed in yet

- **In-App Notifications**:
  - App icon badge: Shows count of pending invitations
  - My Sparks page: Badge on Friend Spark emoji
  - Discovery page: Badge on Friend Spark emoji
  - Settings page: Badge on Friend Spark settings gear
  - Notification persists until invitation is accepted/rejected

#### 1.3 Accept/Reject Invitations
- **Location**: Friend Spark Settings page
- **UI**: List of pending invitations with:
  - Sender name and email
  - "Accept" button (primary)
  - "Reject" button (secondary)
  - Timestamp of invitation
- **Actions**:
  - Accept: Creates mutual friendship relationship (e.g., A is friends with B and B is friends with A), removes notification
  - Reject: Marks invitation as rejected, removes notification
  - Both actions update Firestore and clear notifications

#### 1.4 Friend List
- **Main Page**: Shows list of accepted friends
- **Display**: 
  - Friend name (from their profile)
  - Friend email
  - Friend avatar (if available)
  - "Remove Friend" option (destructive action)
- **Data Structure**:
```typescript
interface Friendship {
  id: string;
  userId1: string;
  userId2: string;
  user1Email: string;
  user2Email: string;
  createdAt: Timestamp;
  // For querying: always store lower userId first for consistency
}
```

### Phase 2: Shareable Sparks Integration

#### 2.1 Shareable Spark Interface
- **Registration**: Sparks can register as "Shareable"
- **Interface**:
```typescript
interface ShareableSpark {
  sparkId: string;
  shareableItems: ShareableItem[];
  onShareItem: (itemId: string, friendId: string) => Promise<void>;
  onAcceptSharedItem: (shareId: string) => Promise<void>;
  onRejectSharedItem: (shareId: string) => Promise<void>;
}

interface ShareableItem {
  id: string; // Original item ID (must be preserved)
  title: string;
  description?: string;
  preview?: string; // Preview text/image
  sparkId: string;
}
```

- **Integration Points**:
  - Spark settings can add "Share with Friend" option
  - Friend Spark can query which sparks are shareable
  - Friend Spark can show friend's shareable items

#### 2.2 Friend Profile View
- **Access**: Click on friend in Friend Spark main page
- **Display**: 
  - Friend's name and email
  - List of sparks they have shareable items in
  - For each spark: count of shareable items
  - Click into spark to see items
- **Navigation**: 
  - Click spark → Navigate to that spark with friend's shared items visible
  - Items marked as "Shared by [Friend Name]"

### Phase 3: Sharing Models

#### 3.1 Copy Model (One-Time Push)
**Use Case**: Short Saver, simple data that doesn't need live updates

**How It Works**:
1. User selects item(s) to share
2. System creates a copy of the item with:
   - New ID (preserves original ID in metadata)
   - Original ID stored in `sharedFromId` field
   - `sharedByUserId` field for attribution
   - `sharedAt` timestamp
3. Copy is pushed to friend's spark
4. Friend sees item in their spark (marked as shared)
5. No further updates - it's a snapshot

**Data Structure**:
```typescript
interface SharedItemCopy {
  id: string; // New ID for the copy
  originalId: string; // Original item ID (for reference)
  sharedFromId: string; // Original item ID (same as originalId)
  sharedByUserId: string;
  sharedByUserName: string;
  sharedAt: Timestamp;
  // ... original item data
}
```

**Pros**:
- Simple to implement
- No sync complexity
- Friend owns the copy (can edit/delete)
- Works well for static content

**Cons**:
- No live updates
- Changes to original don't reflect in copy
- Can create duplicates if shared multiple times

**Example - Short Saver**:
- User shares a "short" (text snippet)
- Friend receives copy in their Short Saver
- Friend can edit/delete their copy
- Original remains unchanged

#### 3.2 Shared Model (Live Updates)
**Use Case**: Trip Story, Todo items that need collaborative updates

**How It Works**:
1. User selects item to share
2. System creates a share relationship (not a copy):
   - Original item ID preserved (critical!)
   - Share record links original to friend
   - Friend sees original item (read-only or collaborative)
3. Updates to original reflect in friend's view
4. Friend can accept/reject updates (if collaborative)
5. Friend can "unshare" to stop receiving updates

**Data Structure**:
```typescript
interface ShareRelationship {
  id: string;
  itemId: string; // Original item ID (preserved!)
  itemSparkId: string;
  sharedByUserId: string;
  sharedWithUserId: string;
  shareType: 'read-only' | 'collaborative';
  createdAt: Timestamp;
  acceptedAt?: Timestamp;
  status: 'pending' | 'accepted' | 'rejected';
}

// Item queries include shared items:
// Original: WHERE userId = currentUser OR sharedWithUserId = currentUser
```

**Pros**:
- Live updates
- Single source of truth
- Collaborative editing possible
- No duplicates

**Cons**:
- More complex to implement
- Need conflict resolution
- Original owner controls the item
- Requires careful ID preservation

**Example - Trip Story**:
- User shares a trip
- Friend sees the trip in their Trip Story
- When user adds activities, friend sees them
- Friend can view but not edit (read-only mode)
- Pictures remain linked via original item ID

**Example - Todo**:
- User shares a todo item
- Friend sees it in their Todo spark
- Both can check off items (collaborative)
- Changes sync in real-time

#### 3.3 Hybrid Approach (Recommended)
**Different models for different sparks**:

- **Short Saver**: Copy model (simple, one-time)
- **Trip Story**: Shared model (needs updates, pictures important)
- **Todo**: Shared model with collaborative editing
- **Other sparks**: Configurable per spark

**Implementation**:
- Each shareable spark declares its sharing model
- Friend Spark handles both models
- UI adapts based on model type

### Phase 4: Technical Implementation

#### 4.1 Firestore Collections

**friendInvitations**:
```
friendInvitations/{invitationId}
  - fromUserId: string
  - fromUserEmail: string
  - fromUserName: string
  - toEmail: string
  - toUserId?: string
  - status: 'pending' | 'accepted' | 'rejected'
  - createdAt: Timestamp
  - respondedAt?: Timestamp
```

**friendships**:
```
friendships/{friendshipId}
  - userId1: string (always lower userId)
  - userId2: string (always higher userId)
  - user1Email: string
  - user2Email: string
  - createdAt: Timestamp
```

**sharedItems** (for shared model):
```
sharedItems/{shareId}
  - itemId: string (original item ID - preserved!)
  - itemSparkId: string
  - sharedByUserId: string
  - sharedWithUserId: string
  - shareType: 'read-only' | 'collaborative'
  - status: 'pending' | 'accepted' | 'rejected'
  - createdAt: Timestamp
  - acceptedAt?: Timestamp
```

**sharedItemCopies** (for copy model):
```
sharedItemCopies/{copyId}
  - originalId: string
  - sharedFromId: string
  - sharedByUserId: string
  - sharedWithUserId: string
  - sparkId: string
  - itemData: object (full copy of item)
  - createdAt: Timestamp
```

#### 4.2 Notification System

**FriendInvitationNotificationService**:
- Tracks pending invitations per user
- Updates app icon badge
- Integrates with existing NotificationBadge component
- Clears notifications when invitations are accepted/rejected

**Email Service**:
- Uses Firebase Cloud Functions (or external service)
- Sends invitation emails
- Includes deep link to app
- Fallback for users not yet signed in

#### 4.3 Authentication Persistence

**Current Issue**: Sign-in doesn't persist after app close

**Solution**:
- Google Sign-In: Already persists via Firebase Auth (should work)
- Apple Sign-In: Ensure persistence
- Verify: Check `onAuthStateChanged` listener on app start
- Store: User session persists in Firebase Auth automatically
- If not working: May need to check Firebase Auth configuration

**Implementation**:
- Ensure `AuthService.initialize()` is called on app start
- `onAuthStateChanged` listener restores session
- Verify token refresh is working
- Test: Sign in, close app, reopen → should still be signed in

#### 4.4 Friend Spark UI Components

**FriendSparkMain**:
- Friend list
- "Add Friend" button
- Pending invitations count badge

**FriendSparkSettings**:
- Pending invitations list
- Accept/Reject buttons
- Friend management (remove friend)
- Settings for notifications

**ShareItemModal**:
- Select friend(s)
- Select items to share
- Choose sharing model (if spark supports multiple)
- Confirm and send

**FriendProfileView**:
- Friend info
- Shareable sparks list
- Navigate to shared items

### Phase 5: Integration with Existing Sparks

#### 5.1 Trip Story Integration

**Sharing Model**: Shared (live updates)

**Implementation**:
1. Register Trip Story as shareable:
```typescript
// In TripStorySpark.tsx
const shareableItems: ShareableItem[] = trips.map(trip => ({
  id: trip.id,
  title: trip.title,
  description: `${trip.activities.length} activities`,
  preview: trip.photos[0]?.uri,
  sparkId: 'trip-story'
}));
```

2. Share trip:
   - Create ShareRelationship with `itemId = trip.id` (preserved!)
   - Friend queries trips: `WHERE userId = currentUser OR sharedWithUserId = currentUser`
   - Friend sees shared trip with all activities
   - Pictures remain linked via original trip ID

3. Updates:
   - When owner adds activity, friend sees it
   - When owner adds photo, friend sees it (via original trip ID)
   - Friend can view but not edit (read-only)

**Key Point**: Trip ID is preserved, so all photo references remain valid

#### 5.2 Short Saver Integration

**Sharing Model**: Copy (one-time)

**Implementation**:
1. Register Short Saver as shareable
2. Share short:
   - Create copy with new ID
   - Store original ID in metadata
   - Push to friend's Short Saver
3. Friend receives copy:
   - Can edit/delete independently
   - No connection to original

#### 5.3 Todo Integration

**Sharing Model**: Shared (collaborative)

**Implementation**:
1. Register Todo as shareable
2. Share todo item:
   - Create ShareRelationship
   - Friend sees item in their Todo
3. Collaborative editing:
   - Both users can check off items
   - Changes sync via Firestore listeners
   - Conflict resolution: Last write wins (or timestamp-based)

### Phase 6: Security & Privacy

#### 6.1 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Friend Invitations
    match /friendInvitations/{invitationId} {
      allow create: if isAuthenticated() && 
                       request.resource.data.fromUserId == request.auth.uid;
      allow read: if isAuthenticated() && (
        resource.data.fromUserId == request.auth.uid ||
        resource.data.toUserId == request.auth.uid ||
        (resource.data.toEmail == request.auth.token.email && resource.data.toUserId == null)
      );
      allow update: if isAuthenticated() && 
                        resource.data.toUserId == request.auth.uid &&
                        request.resource.data.status in ['accepted', 'rejected'];
    }
    
    // Friendships
    match /friendships/{friendshipId} {
      allow read: if isAuthenticated() && (
        resource.data.userId1 == request.auth.uid ||
        resource.data.userId2 == request.auth.uid
      );
      allow create: if isAuthenticated() && (
        request.resource.data.userId1 == request.auth.uid ||
        request.resource.data.userId2 == request.auth.uid
      );
      allow delete: if isAuthenticated() && (
        resource.data.userId1 == request.auth.uid ||
        resource.data.userId2 == request.auth.uid
      );
    }
    
    // Shared Items (shared model)
    match /sharedItems/{shareId} {
      allow create: if isAuthenticated() && 
                       request.resource.data.sharedByUserId == request.auth.uid;
      allow read: if isAuthenticated() && (
        resource.data.sharedByUserId == request.auth.uid ||
        resource.data.sharedWithUserId == request.auth.uid
      );
      allow update: if isAuthenticated() && 
                        resource.data.sharedWithUserId == request.auth.uid;
      allow delete: if isAuthenticated() && (
        resource.data.sharedByUserId == request.auth.uid ||
        resource.data.sharedWithUserId == request.auth.uid
      );
    }
    
    // Shared Item Copies (copy model)
    match /sharedItemCopies/{copyId} {
      allow create: if isAuthenticated() && 
                       request.resource.data.sharedByUserId == request.auth.uid;
      allow read: if isAuthenticated() && 
                      resource.data.sharedWithUserId == request.auth.uid;
      allow update, delete: if isAuthenticated() && 
                               resource.data.sharedWithUserId == request.auth.uid;
    }
  }
}
```

#### 6.2 Privacy Considerations
- Users can only see friends they've accepted
- Invitations are private (only sender and recipient)
- Shared items are only visible to the friend they're shared with
- Users can remove friends at any time
- Users can unshare items at any time

### Phase 7: Email Notifications

#### 7.1 Email Service Options

**Option A: Firebase Cloud Functions**
- Pros: Integrated with Firebase, secure
- Cons: Requires Cloud Functions setup, costs

**Option B: External Service (SendGrid, Mailgun, etc.)**
- Pros: Easy to set up, reliable
- Cons: Additional service, API keys needed

**Option C: Simple SMTP (for MVP)**
- Pros: Quick to implement
- Cons: Less reliable, may hit spam

**Recommendation**: Start with Firebase Cloud Functions (most integrated)

#### 7.2 Email Template

**Subject**: "[Friend Name] wants to connect on Sparks"

**Body**:
```
Hi [Recipient Name],

[Friend Name] ([friend@email.com]) wants to connect with you on Sparks!

Click here to accept: [Deep Link]

Or open the Sparks app and check your Friend Spark settings.

[App Store Link] | [Google Play Link]
```

**Deep Link Format**: `sparks://friend-invitation/{invitationId}`

### Phase 8: Implementation Phases

#### Phase 8.1: Core Friend Management (MVP) ✅ COMPLETED
1. ✅ Authentication gate - Implemented with `AuthenticationGate` component
2. ✅ Create invitations - Implemented with `CreateInvitationModal`
3. ✅ Accept/reject invitations - Implemented with `InvitationList` component
4. ✅ Friend list - Implemented with `FriendSparkMain` component
5. ✅ Basic notifications - Implemented with `FriendInvitationNotificationService`
6. ✅ Sent Invitations display - Shows most recent 10 sent invitations
7. ✅ Accepted Invitations display - Shows most recent 10 accepted invitations
8. ✅ Delete invitations - Users can delete pending sent invitations
9. ✅ Authentication validation - Prevents creating invitations without sign-in
10. ✅ Sign-in persistence - Auth state persists across app restarts

**Status**: Phase 1 is complete and functional. All core friend management features are working.

#### Phase 8.2: Notification Integration ✅ COMPLETED
1. ✅ App icon badge - Integrated with `FeedbackNotificationService.updateAppIconBadge()`
2. ✅ Spark emoji badges - `NotificationBadge` component supports `friend-spark`
3. ✅ Settings page badges - Badge shown on Friend Spark settings
4. ⏳ Email notifications - **Pending** (Phase 2 - Firebase Cloud Functions)

**Status**: In-app notifications are complete. Email notifications are pending Phase 2 implementation.

#### Phase 8.3: Shareable Sparks Foundation ✅ COMPLETED
1. ✅ ShareableSpark interface - Implemented `ShareableSparkService`
2. ⏳ Friend profile view - **Pending** (Phase 2 - Click friend to see shareable sparks)
3. ✅ Basic sharing UI - `FriendSelectionModal` component created

**Status**: Foundation is complete. Friend profile view is next phase.

#### Phase 8.4: Copy Model Implementation ✅ COMPLETED
1. ✅ Short Saver integration - Registered as shareable spark with copy model
2. ✅ Copy sharing logic - `ShareableSparkService.shareItemCopy()` implemented
3. ✅ Friend receives copies - `SharedItemsService` loads and auto-accepts shared items
4. ✅ Visual indication - Purple border (`#9B59B6`) on shared items in list view
5. ✅ Sender info display - Shows "Shared by [Name]" with link to Friend Spark in edit modal
6. ✅ Newest-first ordering - Videos sorted by `addedAt`/`sharedAt` (newest at top)
7. ✅ Read-only editing - Shared items cannot be edited (name/URL fields disabled)

**Status**: Copy model is fully implemented for Short Saver. Shared items appear in recipient's list with visual indicators.

#### Phase 8.5: Shared Model Implementation ⏳ NEXT PHASE
1. ⏳ Trip Story integration - **Next to implement**
2. ⏳ Shared relationship logic - **Next to implement**
3. ⏳ Live updates - **Next to implement**
4. ⏳ Read-only viewing - **Next to implement**
5. ⏳ ID preservation - **Critical** - Must preserve original item IDs for pictures/attachments

**Status**: **This is the next phase to tackle.** Copy model is working, now need to implement collaborative sharing for Trip Story.

#### Phase 8.6: Collaborative Features ⏳ FUTURE
1. ⏳ Todo collaborative editing - **Future**
2. ⏳ Conflict resolution - **Future**
3. ⏳ Real-time sync - **Future**

**Status**: Planned for after shared model is complete.

### Phase 9: Data Migration & Edge Cases

#### 9.1 Existing Users
- Users who haven't signed in: Can't use Friend Spark (by design)
- Users with existing data: No migration needed (friend system is new)

#### 9.2 Edge Cases
- User deletes account: Remove from all friendships, cancel pending invitations
- User changes email: Update invitations and friendships
- Duplicate invitations: Prevent or merge
- Self-invitation: Block or allow (probably block)

#### 9.3 ID Preservation (Critical)
- **Shared Model**: Original item ID MUST be preserved
- **Why**: Pictures, references, and other data depend on IDs
- **Implementation**: 
  - Never change `itemId` in ShareRelationship
  - Query items using original ID
  - Friend's view uses original ID for all operations

### Phase 10: Testing Considerations

#### 10.1 Unit Tests
- Invitation creation
- Acceptance/rejection logic
- Friend list queries
- Sharing model logic

#### 10.2 Integration Tests
- End-to-end invitation flow
- Sharing items between friends
- Notification delivery
- Email sending

#### 10.3 Edge Case Tests
- Duplicate invitations
- Self-invitation
- User deletion
- Network failures
- Concurrent updates (for collaborative)

## Technical Architecture

### Services

**FriendService** ✅ IMPLEMENTED:
- ✅ `createInvitation(toEmail: string): Promise<string>`
- ✅ `acceptInvitation(invitationId: string): Promise<void>`
- ✅ `rejectInvitation(invitationId: string): Promise<void>`
- ✅ `getFriends(): Promise<Friend[]>`
- ✅ `removeFriend(friendId: string): Promise<void>`
- ✅ `getPendingInvitations(): Promise<FriendInvitation[]>`
- ✅ `getSentInvitations(): Promise<FriendInvitation[]>` - **Added**
- ✅ `getAcceptedInvitations(): Promise<FriendInvitation[]>` - **Added**
- ✅ `deleteInvitation(invitationId: string): Promise<void>` - **Added**
- ✅ `isFriendByEmail(email: string): Promise<boolean>` - **Added**

**ShareableSparkService** ✅ IMPLEMENTED:
- ✅ `registerSpark(spark: ShareableSpark): void`
- ✅ `getShareableSparks(): ShareableSpark[]`
- ✅ `getShareableSpark(sparkId: string): ShareableSpark | undefined`
- ✅ `isShareable(sparkId: string): boolean`
- ✅ `shareItemCopy(sparkId, itemId, friendId, itemData): Promise<void>` - **Copy model**

**SharedItemsService** ✅ IMPLEMENTED:
- ✅ `getPendingSharedItems(sparkId: string): Promise<SharedItem[]>`
- ✅ `getAcceptedSharedItems(sparkId: string): Promise<SharedItem[]>`
- ✅ `acceptSharedItem(sharedItemId: string): Promise<void>`
- ✅ `rejectSharedItem(sharedItemId: string): Promise<void>`

**FriendInvitationNotificationService** ✅ IMPLEMENTED:
- ✅ `getUnreadCount(): Promise<number>`
- ✅ `markInvitationsAsViewed(invitationIds: string[]): Promise<void>`
- ✅ Integrated with `FeedbackNotificationService.updateAppIconBadge()`

### Components

**FriendSparkMain.tsx**: Main friend list view
**FriendSparkSettings.tsx**: Settings with pending invitations
**ShareItemModal.tsx**: Modal for sharing items
**FriendProfileView.tsx**: View friend's shareable items
**InvitationList.tsx**: List of pending invitations
**FriendList.tsx**: List of accepted friends

## Open Questions

1. **Email Service**: Which service to use? (Recommendation: Firebase Cloud Functions - good!)
2. **Deep Links**: How to handle deep links? (Recommendation: React Navigation deep linking - good!)
3. **Picture Sharing**: When to implement? (Recommendation: Phase 2, after core sharing works - good!)
4. **Collaborative Editing**: Real-time or eventual consistency? (Recommendation: Eventual consistency with Firestore listeners - good!)
5. **Invitation Expiry**: Should invitations expire? (Recommendation: Yes, after 30 days - good!)

## Implementation Status

### ✅ Completed Features

**Phase 1: Core Friend Management**
- Authentication gate with Google and Apple Sign-In
- Create, accept, reject, and delete invitations
- Friend list display
- Sent and accepted invitations display
- Notification badges (app icon, spark emoji, settings)
- Sign-in persistence across app restarts
- Authentication validation before creating invitations

**Phase 2: Copy Model Sharing**
- `ShareableSparkService` for registering shareable sparks
- `SharedItemsService` for managing shared items
- Short Saver registered as copy share service
- Share button in video edit modal
- Friend selection modal for sharing
- Auto-acceptance of shared items
- Visual indicators (purple border) for shared items
- Sender information display with link to Friend Spark
- Newest-first ordering of videos
- Read-only editing for shared items

### ⏳ Next Phase: Collaborative Sharing (Shared Model)

**Priority**: Implement shared model for Trip Story
- Register Trip Story as shareable spark with shared model
- Create share relationships (not copies)
- Preserve original item IDs (critical for pictures)
- Live updates when owner modifies trip
- Read-only viewing for recipients
- Friend can see shared trips in their Trip Story

### ⏳ Future Enhancements

- Email notifications (Firebase Cloud Functions)
- Friend profile view (click friend to see shareable sparks)
- Todo collaborative editing
- Group sharing (share with multiple friends)
- Friend activity feed
- Friend recommendations
- Block/unblock users
- Friend groups/circles
- Privacy settings per friend
- Share entire spark collections
- Friend-to-friend messaging

## Success Metrics

- Number of friendships created
- Invitation acceptance rate
- Items shared per user
- Active friend connections
- Time to accept invitation

## Known Issues & Resolutions

### ✅ Resolved Issues
1. **Authentication not persisting** - Fixed by checking Firebase Auth current user on initialization
2. **fromUserName/fromUserEmail not set** - Fixed by adding authentication validation in `CreateInvitationModal`
3. **Accept/Reject buttons not working** - Fixed by correcting `HapticFeedback` method calls
4. **Share button not working** - Fixed by adding proper logging and error handling
5. **No close button on settings** - Fixed by adding close button to `FriendSparkSettings`

### Current Limitations
- Email notifications not yet implemented (requires Firebase Cloud Functions)
- Friend profile view not yet implemented (Phase 2)
- Collaborative sharing (shared model) not yet implemented (next phase)
