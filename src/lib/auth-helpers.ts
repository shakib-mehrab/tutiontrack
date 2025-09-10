import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { User } from '@/types';

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

    // Create user document in Firestore using Admin SDK
    const newUser: User = {
      uid: userRecord.uid,
      email: userData.email,
      role: userData.role,
      name: userData.name,
      createdAt: new Date(),
      emailVerified: false,
      linkedTuitions: [],
    };

    await adminDb.collection('users').doc(userRecord.uid).set(newUser);

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
