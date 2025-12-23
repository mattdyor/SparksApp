# FRIENDSPARKPLAN: Fix Auth, UI Gates, and Sharing Crash

## 1. Auth Persistence & Global Login
**Problem**: User reports login issues and expects global persistent login.
**Current State**:
- `AuthService` handles Firebase/Google/Apple auth.
- `AuthStore` persists user state via `zustand/middleware/persist` with `AsyncStorage`.
- `App.tsx` initializes `AuthService` and syncs `AuthStore` with Firebase `onAuthStateChanged`.
**Gap**:
- If `AuthStore` persists a user but Firebase session is expired/invalid, `App.tsx` logic might momentarily show authenticated state before `onAuthStateChanged` fires (or doesn't fire if offline/error).
- Need to verify if `App.tsx` effectively "resets" the store if `currentUser` is null on init.
    - Code: `const currentUser = auth.currentUser; if (currentUser) ...`
    - It *doesn't* explicitly clear the store if `currentUser` is null on init, but `onAuthStateChanged` should eventually fire with `null` if signed out.
    - However, `AuthStore` has `persist`. If the app launches and `auth.currentUser` is not yet ready (async), `AuthStore` might still have the old user from disk.
    - We rely on `onAuthStateChanged` to update the store.
**Action**:
- Ensure `AuthStore` doesn't show "authenticated" until Firebase confirms session status, OR ensure that we trust the persisted state until proven otherwise but handle invalid tokens gracefully.
- Check `AuthStore` persistence config.

## 2. Friend Spark Auth Gate
**Problem**: User sees "No friends yet" (authenticated state) instead of "You must be logged in" (unauthenticated state) when not logged in.
**Analysis**:
- This implies `useAuthStore().user` is truthy.
- If the user *thinks* they are not logged in, but the app thinks they *are*, it's a persistence mismatch or a misunderstanding of the "logged in" state (e.g., anonymous user?).
- **Fix**: Verify `AuthenticationGate` logic. Ensure explicit "Standard" or "Anonymous" check if needed. (Code shows we check `user && user.uid`).

## 3. Share Flow Auth Gate
**Problem**: Sharing (Short Saver) says "No friends yet" when unauthenticated, instead of "Log in".
**Analysis**:
- `ShortSaverSpark` likely fetches friends to populate the share modal.
- If unauthenticated, `FriendService.getFriends()` might throw (it calls `ensureAuthenticated()`), or return empty.
- If it throws, does `ShortSaverSpark` catch it and show "No friends yet"?
**Action**:
- Update `ShortSaverSpark` (and `ShareableSparkService` usage) to explicitly check auth state before trying to share or fetch friends.
- Show "Log in to share" prompt if needed.

## 4. Crash on Share (Short Saver)
**Problem**: Crash when clicking a friend's name in share modal.
**Analysis**:
- `handleSelectFriend` calls `ShareableSparkService.shareItemCopy`.
- Crash might be in `ShareableSparkService` or `SharedItemsService`.
- Use static analysis on `ShareableSparkService.ts` and `SharedItemsService.ts`.
**Action**:
- Add error boundaries or safeguards around the share call.
- Check for null/undefined objects being passed to Firebase functions.

## Plan Steps

### Phase 1: Auth & Persistence Verification
1. [ ] Review `AuthService.ts` and `AuthStore.ts` for persistence race conditions.
2. [ ] Ensure `App.tsx` correctly synchronizes auth state on launch.
3. [ ] If necessary, add a logic to "validate" the persisted user against Firebase on startup, or show a loading state until confirmation.

### Phase 2: Friend Spark Auth UI
4. [ ] Verify `FriendSpark.tsx` usage of `AuthenticationGate`.
5. [ ] **Critical**: Why does it think it's logged in?
    - If `AuthStore` has data, it stays logged in.
    - If user explicitly signs out, `AuthStore.clearAuth` should happen.
    - Check `SettingsScreen` or wherever "Sign Out" is located.

### Phase 3: Short Saver Share & Auth
6. [ ] Update `ShortSaverSpark.tsx`:
    - In `handleShareVideo`, check `isAuthenticated`. If not, prompt login.
    - In `FriendSelectionModal` (or wherever the list comes from), ensure it handles unauthenticated state by showing empty or prompt, not just "No friends".

### Phase 4: Fix Crash
7. [ ] Analyze `ShareableSparkService.shareItemCopy`.
8. [ ] Guard against missing parameters or undefined/null values.

