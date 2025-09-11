import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { User } from '@/types';
import { 
  sendWelcomeEmail
} from '@/lib/email-service';
import {
  generateOTP,
  getOTPExpiry,
  sendOTPEmail,
  verifyOTPCode,
  isOTPExpired
} from '@/lib/otp-service';

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

    // Generate OTP
    const otpCode = generateOTP();
    const otpExpiry = getOTPExpiry();

    // Create user document in Firestore using Admin SDK
    const newUser: User = {
      uid: userRecord.uid,
      email: userData.email,
      role: userData.role,
      name: userData.name,
      createdAt: new Date(),
      emailVerified: false,
      otpCode,
      otpExpiry,
      otpAttempts: 0,
      linkedTuitions: [],
    };

    await adminDb.collection('users').doc(userRecord.uid).set(newUser);

    // Send OTP
    const otpResult = await sendOTPEmail(userData.email, userData.name, otpCode);
    
    if (!otpResult.success) {
      console.error('Failed to send OTP:', otpResult.message);
      // Don't fail registration if OTP sending fails, but log it
    }

    return { 
      success: true, 
      message: 'User registered successfully. Please check the console for your OTP code to verify your account.', 
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

export async function verifyUserOTP(email: string, otpCode: string): Promise<{ success: boolean; message: string }> {
  try {
    // Find user by email
    const usersRef = adminDb.collection('users');
    const querySnapshot = await usersRef.where('email', '==', email).get();
    
    if (querySnapshot.empty) {
      return { success: false, message: 'User not found' };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as User;

    // Check if already verified
    if (userData.emailVerified) {
      return { success: false, message: 'Email is already verified' };
    }

    // Check if OTP exists
    if (!userData.otpCode) {
      return { success: false, message: 'No OTP found. Please request a new one.' };
    }

    // Check OTP attempts (limit to 5 attempts)
    const maxAttempts = 5;
    const currentAttempts = userData.otpAttempts || 0;
    
    if (currentAttempts >= maxAttempts) {
      return { success: false, message: 'Too many failed attempts. Please request a new OTP.' };
    }

    // Check if OTP has expired
    const otpExpiry = userData.otpExpiry;
    
    if (otpExpiry && otpExpiry instanceof Date && isOTPExpired(otpExpiry)) {
      return { success: false, message: 'OTP has expired. Please request a new one.' };
    }

    if (otpExpiry && 'toDate' in otpExpiry && typeof otpExpiry.toDate === 'function') {
      const expiryDate = otpExpiry.toDate();
      if (isOTPExpired(expiryDate)) {
        return { success: false, message: 'OTP has expired. Please request a new one.' };
      }
    }

    // Verify OTP
    if (!verifyOTPCode(otpCode, userData.otpCode)) {
      // Increment failed attempts
      await userDoc.ref.update({
        otpAttempts: currentAttempts + 1,
      });
      
      const remainingAttempts = maxAttempts - (currentAttempts + 1);
      return { 
        success: false, 
        message: `Invalid OTP code. ${remainingAttempts} attempts remaining.` 
      };
    }

    // OTP is valid - verify the user
    await userDoc.ref.update({
      emailVerified: true,
      otpCode: null,
      otpExpiry: null,
      otpAttempts: null,
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
    console.error('OTP verification error:', error);
    return { success: false, message: 'Failed to verify OTP' };
  }
}

export async function resendOTP(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const user = await getUserByEmail(email);
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.emailVerified) {
      return { success: false, message: 'Email is already verified' };
    }

    // Generate new OTP
    const otpCode = generateOTP();
    const otpExpiry = getOTPExpiry();

    // Reset attempts and update user with new OTP
    await adminDb.collection('users').doc(user.uid).update({
      otpCode,
      otpExpiry,
      otpAttempts: 0,
    });

    // Send OTP
    const otpResult = await sendOTPEmail(user.email, user.name, otpCode);
    
    return otpResult;
  } catch (error) {
    console.error('Resend OTP error:', error);
    return { success: false, message: 'Failed to resend OTP' };
  }
}
