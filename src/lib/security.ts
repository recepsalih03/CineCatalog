import { headers } from 'next/headers'
import { rateLimit } from './rateLimit'

export class SecurityError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'SecurityError'
  }
}

export async function validateRequest(context: 'general' | 'admin' | 'login' = 'general') {
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''
  const xForwardedFor = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  const clientIp = xForwardedFor?.split(',')[0] || realIp || 'unknown'

  if (!userAgent || userAgent.length < 10) {
    throw new SecurityError('Invalid user agent', 'INVALID_USER_AGENT')
  }

  const isBot = /bot|crawl|spider|scrape/i.test(userAgent)
  if (isBot && context === 'admin') {
    throw new SecurityError('Bot access denied', 'BOT_ACCESS_DENIED')
  }

  const { success, reset, remaining } = await rateLimit.check(clientIp, context)
  if (!success) {
    throw new SecurityError(
      `Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds`,
      'RATE_LIMIT_EXCEEDED'
    )
  }

  return {
    clientIp,
    userAgent,
    remaining,
    reset
  }
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .trim()
}

export function validateEnvConfig() {
  const requiredEnvVars = [
    'NEXTAUTH_SECRET',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
  ]

  const missing = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length < 8) {
    throw new Error('Admin password must be at least 8 characters long')
  }
}

export const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://firestore.googleapis.com https://*.firebase.googleapis.com",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
}