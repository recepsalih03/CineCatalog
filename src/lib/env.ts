import { validateEnvConfig } from './security'

validateEnvConfig()

export function validateFirebaseConfig() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  const missing = requiredEnvVars.filter(
    envVar => !process.env[envVar] || process.env[envVar] === 'your_api_key_here'
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing or invalid Firebase configuration. Please check your .env.local file for: ${missing.join(', ')}`
    );
  }
}

export function validateAuthConfig() {
  const requiredEnvVars = [
    'NEXTAUTH_SECRET',
    'ADMIN_USERNAME', 
    'ADMIN_PASSWORD',
  ];

  const missing = requiredEnvVars.filter(
    envVar => !process.env[envVar] || process.env[envVar]?.includes('your_')
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing or invalid auth configuration. Please check your .env.local file for: ${missing.join(', ')}`
    );
  }

  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length < 8) {
    throw new Error('Admin password must be at least 8 characters long')
  }
}

export const env = {
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME!,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD!,
  
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID!,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL!,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
};