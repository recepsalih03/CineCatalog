import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export class SecurityEnhancements {
  private static readonly RATE_LIMIT_WINDOW = 60 * 1000;
  private static readonly MAX_REQUESTS_PER_WINDOW = 30;

  static async checkRateLimit(userId: string): Promise<boolean> {
    try {
      if (!userId || userId === 'anonymous' || userId === 'unknown') {
        return true;
      }
      
      const rateLimitRef = doc(db, 'rate_limits', userId);
      const rateLimitDoc = await getDoc(rateLimitRef);
      
      const now = new Date();
      
      if (!rateLimitDoc.exists()) {
        await setDoc(rateLimitRef, {
          requests: 1,
          windowStart: Timestamp.fromDate(now),
          lastRequest: Timestamp.fromDate(now),
        });
        return true;
      }

      const data = rateLimitDoc.data() as {
        requests: number;
        windowStart: { toDate(): Date };
        lastRequest: { toDate(): Date };
      };
      
      const windowStart = data.windowStart.toDate();
      const timeSinceWindowStart = now.getTime() - windowStart.getTime();

      if (timeSinceWindowStart > this.RATE_LIMIT_WINDOW) {
        await updateDoc(rateLimitRef, {
          requests: 1,
          windowStart: Timestamp.fromDate(now),
          lastRequest: Timestamp.fromDate(now),
        });
        return true;
      }

      if (data.requests >= this.MAX_REQUESTS_PER_WINDOW) {
        return false;
      }

      await updateDoc(rateLimitRef, {
        requests: data.requests + 1,
        lastRequest: Timestamp.fromDate(now),
      });

      return true;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true;
    }
  }

  static validateMovieData(data: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Film başlığı gerekli');
    } else if (data.title.length > 200) {
      errors.push('Film başlığı 200 karakterden uzun olamaz');
    }

    if (!data.year || typeof data.year !== 'number') {
      errors.push('Yıl gerekli ve sayı olmalı');
    } else if (data.year < 1800 || data.year > new Date().getFullYear() + 5) {
      errors.push('Geçersiz yıl');
    }

    if (!data.director || typeof data.director !== 'string' || data.director.trim().length === 0) {
      errors.push('Yönetmen adı gerekli');
    } else if (data.director.length > 100) {
      errors.push('Yönetmen adı 100 karakterden uzun olamaz');
    }

    if (!data.hardDrive || typeof data.hardDrive !== 'string' || data.hardDrive.trim().length === 0) {
      errors.push('Harddisk adı gerekli');
    } else if (data.hardDrive.length > 50) {
      errors.push('Harddisk adı 50 karakterden uzun olamaz');
    }

    if (data.movieLink && typeof data.movieLink === 'string' && data.movieLink.length > 0) {
      try {
        new URL(data.movieLink);
      } catch {
        errors.push('Geçersiz film linki');
      }
    }

    if (data.directorLink && typeof data.directorLink === 'string' && data.directorLink.length > 0) {
      try {
        new URL(data.directorLink);
      } catch {
        errors.push('Geçersiz yönetmen linki');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '')
      .substring(0, 1000);
  }

  static isValidAdmin(userIdentifier?: string): boolean {
    if (!userIdentifier) return false;
    
    const adminUsername = process.env.ADMIN_USERNAME || '';
    
    return userIdentifier.toLowerCase() === adminUsername.toLowerCase();
  }
}

export const securityEnhancements = SecurityEnhancements;