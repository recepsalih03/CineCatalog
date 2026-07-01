import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export type AuditAction = 
  | 'movie_create' 
  | 'movie_update' 
  | 'movie_delete' 
  | 'admin_login' 
  | 'admin_logout';

export interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  resourceId?: string;
  resourceType?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  userEmail?: string;
  ipAddress?: string;
}

class AuditLogger {
  private async log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    try {
      await addDoc(collection(db, 'admin_logs'), {
        ...entry,
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }

  async logMovieCreate(userId: string, movieId: string, movieData: Record<string, unknown>, userEmail?: string): Promise<void> {
    await this.log({
      userId,
      action: 'movie_create',
      resourceId: movieId,
      resourceType: 'movie',
      details: {
        title: movieData.title,
        year: movieData.year,
        director: movieData.director,
      },
      userEmail,
    });
  }

  async logMovieUpdate(userId: string, movieId: string, changes: Record<string, unknown>, userEmail?: string): Promise<void> {
    await this.log({
      userId,
      action: 'movie_update',
      resourceId: movieId,
      resourceType: 'movie',
      details: { changes },
      userEmail,
    });
  }

  async logMovieDelete(userId: string, movieId: string, movieTitle: string, userEmail?: string): Promise<void> {
    await this.log({
      userId,
      action: 'movie_delete',
      resourceId: movieId,
      resourceType: 'movie',
      details: { title: movieTitle },
      userEmail,
    });
  }

  async logAdminLogin(userId: string, userEmail?: string): Promise<void> {
    await this.log({
      userId,
      action: 'admin_login',
      userEmail,
    });
  }

  async logAdminLogout(userId: string, userEmail?: string): Promise<void> {
    await this.log({
      userId,
      action: 'admin_logout',
      userEmail,
    });
  }
}

export const auditLogger = new AuditLogger();