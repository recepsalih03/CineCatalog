import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { validateAdminCredentials, hashWithSHA256 } from '@/lib/auth';

const handler = NextAuth({
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
    name: "__Secure-next-auth.session-token",
    options: {
      httpOnly: true,
      sameSite: "none", 
      path: "/",
      secure: true,
      domain: ".cinecatalog.com", 
    },
  },
  csrfToken: {
    name: "__Host-next-auth.csrf-token",
    options: {
      httpOnly: true,
      sameSite: "none",
      path: "/", 
      secure: true,
    },
  },
  callbackUrl: {
    name: "__Secure-next-auth.callback-url",
    options: {
      httpOnly: false,
      sameSite: "none",
      path: "/",
      secure: true,
      domain: ".cinecatalog.com",
    },
  },
},
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
});

export { handler as GET, handler as POST };