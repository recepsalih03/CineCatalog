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
              name: credentials.username,
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
          token.userId = user.id;
          token.userName = user.name || undefined;
          token.secureHash = hashWithSHA256(`${user.id}-${token.iat}`);
        }
        return token;
      },
      async session({ session, token }) {
        if (token) {
          session.user.id = token.userId as string;
          session.user.name = (token.userName as string) || null;
          session.user.role = token.role as string;
          session.user.secureHash = token.secureHash as string;
        }
        return session;
      },
    },
    session: {
      strategy: 'jwt',
      maxAge: 24 * 60 * 60,
    },
    cookies: {
  sessionToken: {
    name: process.env.NODE_ENV === 'production' ? "__Secure-next-auth.session-token" : "next-auth.session-token",
    options: {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax", 
      path: "/",
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.NODE_ENV === 'production' ? ".cinecatalog.com" : undefined, 
    },
  },
  csrfToken: {
    name: process.env.NODE_ENV === 'production' ? "__Host-next-auth.csrf-token" : "next-auth.csrf-token",
    options: {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax",
      path: "/", 
      secure: process.env.NODE_ENV === 'production',
    },
  },
  callbackUrl: {
    name: process.env.NODE_ENV === 'production' ? "__Secure-next-auth.callback-url" : "next-auth.callback-url",
    options: {
      httpOnly: false,
      sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax",
      path: "/",
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.NODE_ENV === 'production' ? ".cinecatalog.com" : undefined,
    },
  },
},
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
});

export { handler as GET, handler as POST };