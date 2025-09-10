# Firebase Firestore Security Rules Setup

## The Issue
You're getting a "Missing or insufficient permissions" error because your Firestore database has default security rules that deny all read/write operations.

## Solution: Update Firestore Security Rules

### Step 1: Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your TuitionTrack project
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab

### Step 2: Update Security Rules
Replace the existing rules with the content from `firestore.rules` file:

1. Copy the content from `firestore.rules`
2. Paste it into the Rules editor in Firebase Console
3. Click **Publish** to apply the rules

### Step 3: Verify Rules Are Applied
The rules should now allow:
- ✅ Users to read/write their own profile data
- ✅ Admin SDK to create users during registration
- ✅ Teachers to create and manage tuitions
- ✅ Students to access tuitions they're enrolled in
- ✅ Authenticated users to access class and log data

## Alternative: Temporary Testing Rules
If you want to test quickly, you can use these permissive rules temporarily (NOT for production):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ Warning:** These rules allow any authenticated user to access all data. Only use for testing!

## Environment Variables Check
Also ensure your Firebase Admin environment variables are correctly set in `.env.local`:

```env
# Firebase Admin SDK (for server-side operations)
FIREBASE_ADMIN_CLIENT_EMAIL=your-firebase-admin@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Firebase Client SDK (for client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

## Getting Firebase Admin Credentials
If you don't have the admin credentials:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract the `client_email` and `private_key` values
5. Add them to your `.env.local` file

## Testing After Fix
1. Apply the security rules in Firebase Console
2. Restart your development server: `npm run dev`
3. Try registering a new user
4. Try signing in

The "Missing or insufficient permissions" error should now be resolved! 🚀
