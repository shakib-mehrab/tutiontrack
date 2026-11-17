import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { User } from '@/types';
import { sendWelcomeEmail } from '@/lib/email-service';
import {
  generateOTP,
  getOTPExpiry,
  hashOTP,
  sendOTPEmail,
  verifyOTPCode,
  isOTPExpired,
  OTP_MAX_ATTEMPTS,
  OTP_MAX_SENDS_PER_HOUR,
  OTP_RESEND_COOLDOWN_SECONDS,
} from '@/lib/otp-service';

export interface RegisterUserData {
  email: string;
  password: string;
  name: string;
  role: 'teacher' | 'student';
}

type Result = { success: boolean; message: string };

const GENERIC_OTP_FAILURE = 'Invalid or expired code. Please request a new one.';
const GENERIC_RESEND_MESSAGE = 'If an unverified account exists for this email, a new code has been sent.';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Finds a user doc by email. New accounts store lowercase emails; older ones may have
 * been saved exactly as typed, so fall back to the trimmed original.
 */
async function findUserDocByEmail(rawEmail: string) {
  const users = getAdminDb().collection('users');
  const normalized = normalizeEmail(rawEmail);
  let snap = await users.where('email', '==', normalized).limit(1).get();
  if (snap.empty && rawEmail.trim() !== normalized) {
    snap = await users.where('email', '==', rawEmail.trim()).limit(1).get();
  }
  return snap.empty ? null : snap.docs[0];
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

export async function registerUser(userData: RegisterUserData): Promise<Result & { uid?: string }> {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const email = normalizeEmail(userData.email);

    if (userData.password.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters' };
    }

    if (await findUserDocByEmail(userData.email)) {
      return { success: false, message: 'User with this email already exists' };
    }

    const userRecord = await adminAuth.createUser({
      email,
      password: userData.password,
      displayName: userData.name,
      emailVerified: false,
    });

    const otpCode = generateOTP();
    const now = new Date();

    const newUser: User = {
      uid: userRecord.uid,
      email,
      role: userData.role,
      name: userData.name.trim(),
      createdAt: now,
      emailVerified: false,
      otpHash: hashOTP(otpCode, email),
      otpExpiry: getOTPExpiry(),
      otpAttempts: 0,
      otpLastSentAt: now,
      otpSendCount: 1,
      otpSendWindowStart: now,
      linkedTuitions: [],
    };

    await adminDb.collection('users').doc(userRecord.uid).set(newUser);

    const otpResult = await sendOTPEmail(email, newUser.name, otpCode);
    if (!otpResult.success) {
      console.error('Failed to send OTP:', otpResult.message);
    }

    return {
      success: true,
      message: 'Account created. Check your email for a verification code.',
      uid: userRecord.uid,
    };
  } catch (error: unknown) {
    console.error('Registration error:', error);
    const code = (error as { code?: string }).code;
    if (code === 'auth/email-already-exists') {
      return { success: false, message: 'User with this email already exists' };
    }
    if (code === 'auth/invalid-password') {
      return { success: false, message: 'Password must be at least 8 characters' };
    }
    if (code === 'auth/invalid-email') {
      return { success: false, message: 'Invalid email address' };
    }
    return { success: false, message: 'Registration failed. Please try again.' };
  }
}

export async function getUserData(uid: string): Promise<User | null> {
  try {
    const userDoc = await getAdminDb().collection('users').doc(uid).get();
    return userDoc.exists ? (userDoc.data() as User) : null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const doc = await findUserDocByEmail(email);
    return doc ? (doc.data() as User) : null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

export async function verifyUserOTP(rawEmail: string, otpCode: string): Promise<Result> {
  try {
    const email = normalizeEmail(rawEmail);
    const userDoc = await findUserDocByEmail(rawEmail);

    // Same message for "no such user" and "already verified" so this endpoint can't be used
    // to discover which emails are registered.
    if (!userDoc) return { success: false, message: GENERIC_OTP_FAILURE };

    const userData = userDoc.data() as User;
    if (userData.emailVerified || !userData.otpHash) {
      return { success: false, message: GENERIC_OTP_FAILURE };
    }

    const attempts = userData.otpAttempts || 0;
    if (attempts >= OTP_MAX_ATTEMPTS) {
      return { success: false, message: 'Too many failed attempts. Please request a new code.' };
    }

    const expiry = toDate(userData.otpExpiry);
    if (!expiry || isOTPExpired(expiry)) {
      return { success: false, message: 'Code has expired. Please request a new one.' };
    }

    if (!verifyOTPCode(String(otpCode).trim(), email, userData.otpHash)) {
      await userDoc.ref.update({ otpAttempts: attempts + 1 });
      const remaining = OTP_MAX_ATTEMPTS - (attempts + 1);
      return {
        success: false,
        message: remaining > 0 ? `Invalid code. ${remaining} attempts remaining.` : 'Too many failed attempts. Please request a new code.',
      };
    }

    await userDoc.ref.update({
      emailVerified: true,
      otpHash: null,
      otpCode: null,
      otpExpiry: null,
      otpAttempts: null,
    });
    await getAdminAuth().updateUser(userData.uid, { emailVerified: true });

    const welcome = await sendWelcomeEmail(userData.email, userData.name, userData.role);
    if (!welcome.success) {
      console.error('Failed to send welcome email:', welcome.message);
    }

    return { success: true, message: 'Email verified successfully!' };
  } catch (error) {
    console.error('OTP verification error:', error);
    return { success: false, message: 'Failed to verify code' };
  }
}

export async function resendOTP(rawEmail: string): Promise<Result> {
  try {
    const email = normalizeEmail(rawEmail);
    const userDoc = await findUserDocByEmail(rawEmail);

    // Don't reveal whether the account exists or is already verified.
    if (!userDoc) return { success: true, message: GENERIC_RESEND_MESSAGE };
    const user = userDoc.data() as User;
    if (user.emailVerified) return { success: true, message: GENERIC_RESEND_MESSAGE };

    const now = new Date();

    const lastSent = toDate(user.otpLastSentAt);
    if (lastSent && now.getTime() - lastSent.getTime() < OTP_RESEND_COOLDOWN_SECONDS * 1000) {
      const wait = Math.ceil((OTP_RESEND_COOLDOWN_SECONDS * 1000 - (now.getTime() - lastSent.getTime())) / 1000);
      return { success: false, message: `Please wait ${wait} seconds before requesting another code.` };
    }

    const windowStart = toDate(user.otpSendWindowStart);
    const inWindow = !!windowStart && now.getTime() - windowStart.getTime() < 60 * 60 * 1000;
    const sendCount = inWindow ? user.otpSendCount || 0 : 0;
    if (sendCount >= OTP_MAX_SENDS_PER_HOUR) {
      return { success: false, message: 'Too many codes requested. Please try again in an hour.' };
    }

    const otpCode = generateOTP();
    await userDoc.ref.update({
      otpHash: hashOTP(otpCode, email),
      otpCode: null, // clear any legacy plaintext code
      otpExpiry: getOTPExpiry(),
      otpAttempts: 0,
      otpLastSentAt: now,
      otpSendCount: sendCount + 1,
      otpSendWindowStart: inWindow ? windowStart : now,
    });

    const sent = await sendOTPEmail(email, user.name, otpCode);
    if (!sent.success) {
      return { success: false, message: 'Could not send the code. Please try again later.' };
    }
    return { success: true, message: GENERIC_RESEND_MESSAGE };
  } catch (error) {
    console.error('Resend OTP error:', error);
    return { success: false, message: 'Failed to resend code' };
  }
}
