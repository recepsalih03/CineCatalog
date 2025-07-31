import { db } from './firebaseAdmin';
import { Movie } from '@/types/movie';

const COLLECTION_NAME = 'movies';

export const movieServiceAdmin = {
  async getAllMovies(): Promise<Movie[]> {
    try {
      const snapshot = await db.collection(COLLECTION_NAME).orderBy('title').get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Movie[];
    } catch (error) {
      console.error('❌ Admin: Error fetching movies:', error);
      throw error;
    }
  },

  async createMovie(movieData: Omit<Movie, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const docRef = await db.collection(COLLECTION_NAME).add({
        ...movieData,
        createdAt: now,
        updatedAt: now,
      });
      return docRef.id;
    } catch (error) {
      console.error('❌ Admin: Error creating movie:', error);
      throw error;
    }
  },

  async updateMovie(id: string, movieData: Partial<Movie>): Promise<void> {
    try {
      const now = new Date();
      await db.collection(COLLECTION_NAME).doc(id).update({
        ...movieData,
        updatedAt: now,
      });
    } catch (error) {
      console.error('❌ Admin: Error updating movie:', error);
      throw error;
    }
  },

  async deleteMovie(id: string): Promise<void> {
    try {
      await db.collection(COLLECTION_NAME).doc(id).delete();
    } catch (error) {
      console.error('❌ Admin: Error deleting movie:', error);
      throw error;
    }
  },

  async updateMovieWatchedStatus(id: string, watched: boolean): Promise<void> {
    try {
      const now = new Date();
      await db.collection(COLLECTION_NAME).doc(id).update({
        watched,
        updatedAt: now,
      });
    } catch (error) {
      console.error('❌ Admin: Error updating movie watched status:', error);
      throw error;
    }
  },

  async getUniqueHardDrives(): Promise<string[]> {
    try {
      const snapshot = await db.collection(COLLECTION_NAME).get();
      
      const hardDrives = new Set<string>();
      snapshot.docs.forEach(doc => {
        const movie = doc.data() as Movie;
        hardDrives.add(movie.hardDrive);
      });
      
      return Array.from(hardDrives).sort();
    } catch (error) {
      console.error('❌ Admin: Error fetching unique hard drives:', error);
      throw error;
    }
  }
};