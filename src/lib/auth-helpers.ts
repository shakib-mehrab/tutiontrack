import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { User } from '@/types';
import { 
  sendVerificationEmail, 
  sendWelcomeEmail, 
  generateVerificationToken, 
  getTokenExpiry 
} from '@/lib/email-service';

export interface RegisterUserData {
  email: string;
  password: string;
  name: string;
  role: 'teacher' | 'student';
}

export async function registerUser(userData: RegisterUserData): Promise<{ success: boolean; message: string; uid?: string }> {
  try {
    // Check if user already exists in Firestore
    const usersRef = adminDb.collection('users');
    const existingUsers = await usersRef.where('email', '==', userData.email).get();
    
    if (!existingUsers.empty) {
      return { success: false, message: 'User with this email already exists' };
    }

    // Create Firebase Auth user using Admin SDK
    const userRecord = await adminAuth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.name,
      emailVerified: false,
    });

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = getTokenExpiry();

    // Create user document in Firestore using Admin SDK
    const newUser: User = {
      uid: userRecord.uid,
      email: userData.email,
      role: userData.role,
      name: userData.name,
      createdAt: new Date(),
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry,
      linkedTuitions: [],
    };

    await adminDb.collection('users').doc(userRecord.uid).set(newUser);

    // Send verification email
    const emailResult = await sendVerificationEmail(userData.email, userData.name, verificationToken);
    
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.message);
      // Don't fail registration if email fails, but log it
    }

    return { 
      success: true, 
      message: 'User registered successfully. Please check your email for verification.', 
      uid: userRecord.uid 
    };
  } catch (error: unknown) {
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    return { success: false, message: errorMessage };
  }
}

export async function getUserData(uid: string): Promise<User | null> {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (userDoc.exists) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const usersRef = adminDb.collection('users');
    const querySnapshot = await usersRef.where('email', '==', email).get();
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

export async function verifyUserEmail(token: string): Promise<{ success: boolean; message: string }> {
  try {
    // Find user by verification token
    const usersRef = adminDb.collection('users');
    const querySnapshot = await usersRef.where('verificationToken', '==', token).get();
    
    if (querySnapshot.empty) {
      return { success: false, message: 'Invalid verification token' };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as User;

    // Check if token has expired
    const now = new Date();
    const tokenExpiry = userData.verificationTokenExpiry;
    
    if (tokenExpiry && tokenExpiry instanceof Date && tokenExpiry < now) {
      return { success: false, message: 'Verification token has expired. Please request a new one.' };
    }

    if (tokenExpiry && 'toDate' in tokenExpiry && typeof tokenExpiry.toDate === 'function') {
      const expiryDate = tokenExpiry.toDate();
      if (expiryDate < now) {
        return { success: false, message: 'Verification token has expired. Please request a new one.' };
      }
    }

    // Check if already verified
    if (userData.emailVerified) {
      return { success: false, message: 'Email is already verified' };
    }

    // Update user to verified status and remove verification token
    await userDoc.ref.update({
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    });

    // Update Firebase Auth user
    await adminAuth.updateUser(userData.uid, {
      emailVerified: true,
    });

    // Send welcome email
    const welcomeEmailResult = await sendWelcomeEmail(userData.email, userData.name, userData.role);
    
    if (!welcomeEmailResult.success) {
      console.error('Failed to send welcome email:', welcomeEmailResult.message);
      // Don't fail verification if welcome email fails
    }

    return { success: true, message: 'Email verified successfully!' };
  } catch (error) {
    console.error('Email verification error:', error);
    return { success: false, message: 'Failed to verify email' };
  }
}

export async function resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const user = await getUserByEmail(email);
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.emailVerified) {
      return { success: false, message: 'Email is already verified' };
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = getTokenExpiry();

    // Update user with new token
    await adminDb.collection('users').doc(user.uid).update({
      verificationToken,
      verificationTokenExpiry,
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(user.email, user.name, verificationToken);
    
    return emailResult;
  } catch (error) {
    console.error('Resend verification email error:', error);
    return { success: false, message: 'Failed to resend verification email' };
  }
}
