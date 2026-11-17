import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getAdminAuth, getAdminDb } from './firebase-admin';
import { User } from '@/types';

/**
 * Verifies an email/password against Firebase Auth using its REST endpoint.
 * This is stateless per request. (The browser SDK's signInWithEmailAndPassword keeps one
 * shared signed-in user per server process, which must never be used on the server.)
 * Returns the Firebase uid on success; throws one of our error codes otherwise.
 */
async function verifyPassword(email: string, password: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error('AUTH_ERROR');

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: false }),
      cache: 'no-store',
    }
  );

  const data = (await res.json()) as { localId?: string; error?: { message?: string } };
  if (res.ok && data.localId) return data.localId;

  const code = data.error?.message ?? '';
  if (
    code.startsWith('INVALID_LOGIN_CREDENTIALS') ||
    code.startsWith('INVALID_PASSWORD') ||
    code.startsWith('EMAIL_NOT_FOUND') ||
    code.startsWith('USER_DISABLED')
  ) {
    throw new Error('INVALID_CREDENTIALS');
  }
  if (code.startsWith('INVALID_EMAIL')) throw new Error('INVALID_EMAIL');
  if (code.startsWith('TOO_MANY_ATTEMPTS_TRY_LATER')) throw new Error('TOO_MANY_REQUESTS');
  throw new Error('AUTH_ERROR');
}

const KNOWN_ERRORS = new Set([
  'UNVERIFIED_EMAIL',
  'USER_NOT_FOUND',
  'INVALID_CREDENTIALS',
  'INVALID_EMAIL',
  'TOO_MANY_REQUESTS',
]);

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
          const uid = await verifyPassword(credentials.email.trim(), credentials.password);

          const firebaseUser = await getAdminAuth().getUser(uid);
          if (!firebaseUser.emailVerified) {
            throw new Error('UNVERIFIED_EMAIL');
          }

          const userDoc = await getAdminDb().collection('users').doc(uid).get();
          if (!userDoc.exists) {
            throw new Error('USER_NOT_FOUND');
          }
          const userData = userDoc.data() as User;

          return {
            id: uid,
            email: firebaseUser.email!,
            name: userData.name,
            role: userData.role,
          };
        } catch (error: unknown) {
          if (error instanceof Error && KNOWN_ERRORS.has(error.message)) {
            throw error;
          }
          console.error('Auth error:', error);
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
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }

      // Older tokens may lack a role; look it up once.
      if (!token.role && token.sub) {
        try {
          const userDoc = await getAdminDb().collection('users').doc(token.sub).get();
          if (userDoc.exists) {
            token.role = (userDoc.data() as User).role;
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
      if (url.startsWith('/auth/signout')) {
        return `${baseUrl}/auth/signin`;
      }
      if (url === baseUrl || url === `${baseUrl}/` || url === '/') {
        return `${baseUrl}/dashboard`;
      }
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // malformed URL: fall through to dashboard
      }
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
  },
};

export { authOptions };
