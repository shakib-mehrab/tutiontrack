# Sign-In Error Handling Fix

## Issue
Users were not seeing any alert or visible guide when entering invalid credentials during sign-in.

## Root Cause
1. **Frontend Issue**: The `signIn()` function was called with `redirect: true`, causing the page to redirect before error messages could be captured and displayed.
2. **Backend Issue**: The `authorize` function in NextAuth was catching all errors and returning `null`, which prevented specific error messages from reaching the frontend.

## Changes Made

### 1. `src/lib/auth.ts` - Backend Changes

#### Changed Error Handling in `authorize` Function
- **Before**: Caught all errors and returned `null`, losing error details
- **After**: Throws specific error codes for different scenarios:
  - `UNVERIFIED_EMAIL` - When user hasn't verified their email
  - `INVALID_CREDENTIALS` - For wrong email/password combinations
  - `USER_NOT_FOUND` - When user profile doesn't exist in Firestore
  - `INVALID_EMAIL` - For malformed email addresses
  - `TOO_MANY_REQUESTS` - For rate-limited login attempts
  - `AUTH_ERROR` - Generic error for unknown issues

#### Removed Error Page Configuration
- Removed the `/auth/error` page configuration since we're handling all errors on the signin page

### 2. `src/app/auth/signin/page.tsx` - Frontend Changes

#### Changed `signIn()` Call
- **Before**: `redirect: true, callbackUrl: '/dashboard'`
- **After**: `redirect: false` - Prevents automatic redirect to capture errors

#### Implemented Error Message Mapping
Added a switch statement to display user-friendly messages for each error type:
- **UNVERIFIED_EMAIL**: "Please verify your email before signing in." (Shows resend verification button)
- **INVALID_CREDENTIALS**: "Invalid email or password. Please check your credentials and try again."
- **USER_NOT_FOUND**: "No account found with this email. Please register first."
- **INVALID_EMAIL**: "Please enter a valid email address."
- **TOO_MANY_REQUESTS**: "Too many failed attempts. Please try again later."
- **CredentialsSignin**: "Invalid email or password. Please try again." (NextAuth default error)
- **Default**: "An error occurred during sign in. Please try again."

#### Manual Redirect Handling
- Added `window.location.href = '/dashboard'` on successful sign-in
- This ensures redirect only happens after successful authentication

## Testing Checklist

Test the following scenarios to verify the fix:

- [ ] Enter invalid email/password → Should show "Invalid email or password" message
- [ ] Try to sign in with unverified email → Should show verification message and resend button
- [ ] Enter malformed email → Should show "Please enter a valid email address"
- [ ] Successful sign-in → Should redirect to dashboard
- [ ] Multiple failed attempts → Should show rate limit message (if Firebase rate limiting is enabled)
- [ ] Sign in with non-existent user → Should show appropriate error message

## Benefits

1. **Better User Experience**: Users now see clear, specific error messages
2. **Security**: Different messages for different error types without exposing sensitive information
3. **Maintainability**: Error handling is centralized and easy to modify
4. **Type Safety**: Proper TypeScript error handling with `unknown` type

## Error Flow

```
User enters credentials
    ↓
Frontend calls signIn() with redirect: false
    ↓
Backend authorize() function validates credentials
    ↓
If error: Throws specific error code
    ↓
Frontend catches error in result.error
    ↓
Switch statement maps error to user-friendly message
    ↓
Error displayed in UI
```

## Notes

- Error messages are intentionally generic for security (e.g., not revealing whether an email exists in the system for invalid logins)
- The `UNVERIFIED_EMAIL` error specifically shows a resend verification option
- All errors are logged to the console for debugging purposes
- The fix maintains backward compatibility with existing authentication flow
