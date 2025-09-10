import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
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
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', userData.email));
    const existingUsers = await getDocs(q);
    
    if (!existingUsers.empty) {
      return { success: false, message: 'User with this email already exists' };
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const firebaseUser = userCredential.user;

    // Send email verification
    await sendEmailVerification(firebaseUser);

    // Create user document in Firestore
    const newUser: User = {
      uid: firebaseUser.uid,
      email: userData.email,
      role: userData.role,
      name: userData.name,
      createdAt: Timestamp.fromDate(new Date()),
      emailVerified: false,
      linkedTuitions: [],
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

    return { 
      success: true, 
      message: 'User registered successfully. Please check your email for verification.', 
      uid: firebaseUser.uid 
    };
  } catch (error: unknown) {
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Registration failed';
    return { success: false, message: errorMessage };
  }
}

export async function getUserData(uid: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
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
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}
