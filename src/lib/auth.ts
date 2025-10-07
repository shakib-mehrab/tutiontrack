import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '@/types';

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          // Sign in with Firebase Auth
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email as string,
            credentials.password as string
          );

          const firebaseUser = userCredential.user;

          // Check if email is verified
          if (!firebaseUser.emailVerified) {
            throw new Error('UNVERIFIED_EMAIL');
          }

          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (!userDoc.exists()) {
            throw new Error('USER_NOT_FOUND');
          }

          const userData = userDoc.data() as User;

          return {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            name: userData.name,
            role: userData.role,
          };
        } catch (error: unknown) {
          console.error('Auth error:', error);
          
          // Re-throw custom errors
          if (error instanceof Error) {
            if (error.message === 'UNVERIFIED_EMAIL' || error.message === 'USER_NOT_FOUND') {
              throw error;
            }
          }
          
          // Handle Firebase auth errors
          const firebaseError = error as { code?: string; message?: string };
          if (firebaseError.code === 'auth/invalid-credential' || 
              firebaseError.code === 'auth/wrong-password' || 
              firebaseError.code === 'auth/user-not-found') {
            throw new Error('INVALID_CREDENTIALS');
          }
          
          if (firebaseError.code === 'auth/invalid-email') {
            throw new Error('INVALID_EMAIL');
          }
          
          if (firebaseError.code === 'auth/too-many-requests') {
            throw new Error('TOO_MANY_REQUESTS');
          }
          
          // Generic error for unknown issues
          throw new Error('AUTH_ERROR');
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // On sign in, add user role to token
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      
      // On subsequent requests, ensure role persists
      // If token doesn't have role but has sub, fetch from Firestore
      if (!token.role && token.sub) {
        try {
          const userDoc = await getDoc(doc(db, 'users', token.sub));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            token.role = userData.role;
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub!;
        session.user.role = token.role as 'teacher' | 'student';
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle sign out redirect
      if (url.startsWith('/auth/signout')) {
        return `${baseUrl}/auth/signin`;
      }
      
      // After successful sign in, redirect to dashboard
      if (url === baseUrl || url === `${baseUrl}/` || url === '/') {
        return `${baseUrl}/dashboard`;
      }
      
      // Allow relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Allow same-origin URLs
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      
      // Default to dashboard for successful auth
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
  },
};

export { authOptions };
export default NextAuth(authOptions);
