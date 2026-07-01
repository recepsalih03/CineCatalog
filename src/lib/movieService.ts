import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAt,
  endAt,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Movie } from '@/types/movie';

const COLLECTION_NAME = 'movies';

function extractPosterUrlFromMovieLink(movieLink?: string): string | undefined {
  if (!movieLink || !movieLink.includes('turkcealtyazi.org')) {
    return undefined;
  }
  
  try {
    const movieIdMatch = movieLink.match(/\/mov\/(\d+)\//);
    if (movieIdMatch && movieIdMatch[1]) {
      const movieId = movieIdMatch[1];
      return `https://turkcealtyazi.org/images/poster/${movieId}.jpg`;
    }
  } catch (error) {
    console.warn('Error extracting poster URL from movie link:', error);
  }
  
  return undefined;
}

export const movieService = {
  async getAllMovies(maxResults?: number): Promise<Movie[]> {
    try {
      const moviesCollection = collection(db, COLLECTION_NAME);
      const q = maxResults 
        ? query(moviesCollection, orderBy('title'), limit(maxResults))
        : query(moviesCollection, orderBy('title'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const movie = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Movie;
        
        if (!movie.posterUrl && movie.movieLink) {
          movie.posterUrl = extractPosterUrlFromMovieLink(movie.movieLink);
        }
        
        return movie;
      });
    } catch (error) {
      console.error('❌ Error fetching movies:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  },

  async getMoviesWithPagination(pageSize: number = 20, lastDoc?: unknown): Promise<{movies: Movie[], lastDoc: unknown}> {
    try {
      const moviesCollection = collection(db, COLLECTION_NAME);
      let q = query(moviesCollection, orderBy('title'), limit(pageSize));
      
      if (lastDoc) {
        q = query(moviesCollection, orderBy('title'), startAt(lastDoc), limit(pageSize));
      }
      
      const querySnapshot = await getDocs(q);
      const movies = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const movie = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Movie;
        
        if (!movie.posterUrl && movie.movieLink) {
          movie.posterUrl = extractPosterUrlFromMovieLink(movie.movieLink);
        }
        
        return movie;
      });

      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      
      return { movies, lastDoc: lastVisible };
    } catch (error) {
      console.error('Error fetching movies with pagination:', error);
      throw error;
    }
  },

  async getMovieById(id: string): Promise<Movie | null> {
    try {
      const movieDoc = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(movieDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const movie = {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Movie;
        
        if (!movie.posterUrl && movie.movieLink) {
          movie.posterUrl = extractPosterUrlFromMovieLink(movie.movieLink);
        }
        
        return movie;
      }
      return null;
    } catch (error) {
      console.error('Error fetching movie:', error);
      throw error;
    }
  },

  async createMovie(movieData: Omit<Movie, 'id' | 'createdAt' | 'updatedAt'>, userId?: string, userEmail?: string): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...movieData,
        createdAt: now,
        updatedAt: now,
      });
      
      if (userId) {
        const { auditLogger } = await import('./auditLogger');
        await auditLogger.logMovieCreate(userId, docRef.id, movieData, userEmail);
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating movie:', error);
      throw error;
    }
  },

  async updateMovie(id: string, movieData: Partial<Movie>, userId?: string, userEmail?: string): Promise<void> {
    try {
      const movieRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(movieRef, {
        ...movieData,
        updatedAt: Timestamp.now(),
      });
      
      if (userId) {
        const { auditLogger } = await import('./auditLogger');
        await auditLogger.logMovieUpdate(userId, id, movieData, userEmail);
      }
    } catch (error) {
      console.error('Error updating movie:', error);
      throw error;
    }
  },

  async deleteMovie(id: string, userId?: string, userEmail?: string): Promise<void> {
    try {
      const movieRef = doc(db, COLLECTION_NAME, id);
      
      let movieTitle = 'Unknown';
      if (userId) {
        const movieDoc = await getDoc(movieRef);
        if (movieDoc.exists()) {
          movieTitle = movieDoc.data().title || 'Unknown';
        }
      }
      
      await deleteDoc(movieRef);
      
      if (userId) {
        const { auditLogger } = await import('./auditLogger');
        await auditLogger.logMovieDelete(userId, id, movieTitle, userEmail);
      }
    } catch (error: unknown) {
      console.error('Error deleting movie:', error);
      const err = error as { code?: string; message?: string };
      console.error('Error code:', err?.code);
      console.error('Error message:', err?.message);
      throw new Error(`Failed to delete movie: ${err?.message || 'Unknown error'}`);
    }
  },

  async searchMovies(searchTerm: string, maxResults: number = 50): Promise<Movie[]> {
    try {
      if (!searchTerm.trim()) {
        return [];
      }

      const searchTermLower = searchTerm.toLowerCase();
      const moviesCollection = collection(db, COLLECTION_NAME);
      
      const titleQuery = query(
        moviesCollection,
        orderBy('title'),
        startAt(searchTermLower),
        endAt(searchTermLower + '\uf8ff'),
        limit(maxResults)
      );

      const directorQuery = query(
        moviesCollection,
        orderBy('director'),
        startAt(searchTermLower),
        endAt(searchTermLower + '\uf8ff'),
        limit(maxResults)
      );

      const [titleSnapshot, directorSnapshot] = await Promise.all([
        getDocs(titleQuery),
        getDocs(directorQuery)
      ]);

      const movieMap = new Map<string, Movie>();
      
      [...titleSnapshot.docs, ...directorSnapshot.docs].forEach(doc => {
        const data = doc.data();
        const movie = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Movie;
        
        if (!movie.posterUrl && movie.movieLink) {
          movie.posterUrl = extractPosterUrlFromMovieLink(movie.movieLink);
        }
        
        if (movie.title.toLowerCase().includes(searchTermLower) ||
            movie.director.toLowerCase().includes(searchTermLower)) {
          movieMap.set(doc.id, movie);
        }
      });

      return Array.from(movieMap.values()).slice(0, maxResults);
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
  },

  async getMoviesByHardDrive(hardDrive: string): Promise<Movie[]> {
    try {
      const moviesCollection = collection(db, COLLECTION_NAME);
      const q = query(
        moviesCollection, 
        where('hardDrive', '==', hardDrive),
        orderBy('title')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const movie = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Movie;
        
        if (!movie.posterUrl && movie.movieLink) {
          movie.posterUrl = extractPosterUrlFromMovieLink(movie.movieLink);
        }
        
        return movie;
      });
    } catch (error) {
      console.error('Error fetching movies by hard drive:', error);
      throw error;
    }
  },

  async updateMovieWatchedStatus(id: string, watched: boolean): Promise<void> {
    try {
      const movieRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(movieRef, {
        watched,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating movie watched status:', error);
      throw error;
    }
  },

  async getUniqueHardDrives(): Promise<string[]> {
    try {
      const moviesCollection = collection(db, COLLECTION_NAME);
      const querySnapshot = await getDocs(moviesCollection);
      
      const hardDrives = new Set<string>();
      querySnapshot.docs.forEach(doc => {
        const movie = doc.data() as Movie;
        hardDrives.add(movie.hardDrive);
      });
      
      return Array.from(hardDrives).sort();
    } catch (error) {
      console.error('Error fetching unique hard drives:', error);
      throw error;
    }
  }
};