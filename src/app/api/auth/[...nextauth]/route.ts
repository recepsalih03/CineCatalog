import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { validateAdminCredentials, hashWithSHA256 } from '@/lib/auth';

// Dynamic URL detection for multiple domains
const getBaseUrl = (req?: Request) => {
  if (req) {
    const host = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    return `${protocol}://${host}`;
  }
  return process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
};


// Dynamic handler with custom baseUrl
const authHandler = (req: Request) => {
  return NextAuth({
    providers: [
      CredentialsProvider({
        name: 'credentials',
        credentials: {
          username: { label: 'Username', type: 'text' },
          password: { label: 'Password', type: 'password' }
        },
        async authorize(credentials) {
          if (!credentials?.username || !credentials?.password) {
            return null;
          }

          const isValid = await validateAdminCredentials({
            username: credentials.username,
            password: credentials.password
          });

          if (isValid) {
            const secureUserId = hashWithSHA256(`admin-${Date.now()}`);
            return {
              id: secureUserId,
              name: 'Admin',
              email: 'admin@moviecatalog.com',
            };
          }

          return null;
        }
      })
    ],
    pages: {
      signIn: '/admin/login',
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.role = 'admin';
          token.secureHash = hashWithSHA256(`${user.id}-${token.iat}`);
        }
        return token;
      },
      async session({ session, token }) {
        if (token) {
          session.user.role = token.role as string;
          session.user.secureHash = token.secureHash as string;
        }
        return session;
      },
    },
    session: {
      strategy: 'jwt',
      maxAge: 24 * 60 * 60, // 24 hours
    },
    cookies: {
      sessionToken: {
        name: `next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
        },
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
    // Dynamic URL based on request
    trustHost: true,
  })(req);
};

export { authHandler as GET, authHandler as POST };