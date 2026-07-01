'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Movie, MovieFormData } from '@/types/movie';
import { movieService } from '@/lib/movieService';
import { Button } from '@/components/ui/button';
import AdminSearchInput from '@/components/AdminSearchInput';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import MovieForm from '@/components/MovieForm';
import { ThemeToggle } from '@/components/ThemeToggle';
import HardDriveFilter from '@/components/HardDriveFilter';
import { Pencil, Trash2, Plus, LogOut, Film, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: keyof Movie; direction: 'asc' | 'desc'} | null>(null);
  const [selectedHardDrive, setSelectedHardDrive] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [totalMovies, setTotalMovies] = useState(0);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [bulkUpdateData, setBulkUpdateData] = useState({
    oldHardDrive: '',
    newHardDrive: ''
  });
  
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/admin/login');
      return;
    }
    loadMovies();
  }, [session, status, router]);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const loadMovies = async () => {
    try {
      const data = await movieService.getAllMovies();
      setMovies(data);
    } catch (error) {
      console.error('Failed to load movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortMovies = useCallback(async () => {
    try {
      
      const filterMovies = () => {
        return new Promise<Movie[]>((resolve) => {
          const processChunk = (startIndex: number, chunkSize: number = 1000) => {
            const endIndex = Math.min(startIndex + chunkSize, movies.length);
            const chunk = movies.slice(startIndex, endIndex);
            
            let filtered = chunk;

            if (debouncedSearchQuery) {
              const searchLower = debouncedSearchQuery.toLowerCase();
              filtered = filtered.filter(movie =>
                movie.title.toLowerCase().includes(searchLower) ||
                movie.director.toLowerCase().includes(searchLower) ||
                movie.hardDrive.toLowerCase().includes(searchLower)
              );
            }

            if (selectedHardDrive) {
              filtered = filtered.filter(movie => movie.hardDrive === selectedHardDrive);
            }

            return filtered;
          };

          const allFilteredChunks: Movie[] = [];
          let currentIndex = 0;
          
          const processNextChunk = () => {
            if (currentIndex >= movies.length) {
              resolve(allFilteredChunks);
              return;
            }
            
            const chunk = processChunk(currentIndex);
            allFilteredChunks.push(...chunk);
            currentIndex += 1000;
            
            setTimeout(processNextChunk, 0);
          };
          
          processNextChunk();
        });
      };

      let filtered = await filterMovies();

      if (sortConfig) {
        filtered = [...filtered].sort((a, b) => {
          const aValue = a[sortConfig.key];
          const bValue = b[sortConfig.key];
          
          if (aValue == null && bValue == null) return 0;
          if (aValue == null) return 1;
          if (bValue == null) return -1;
          
          if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        });
      }

      setTotalMovies(filtered.length);
      setFilteredMovies(filtered);

      const newTotalPages = Math.ceil(filtered.length / itemsPerPage);
      setCurrentPage(prev => {
        if (prev > newTotalPages && newTotalPages > 0) {
          return newTotalPages;
        }
        return prev;
      });
    } catch (error) {
      console.error('Filtering error:', error);
      setFilteredMovies(movies);
      setTotalMovies(movies.length);
    }
  }, [movies, debouncedSearchQuery, selectedHardDrive, sortConfig, itemsPerPage])

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedHardDrive, sortConfig]);

  useEffect(() => {
    filterAndSortMovies();
  }, [movies, debouncedSearchQuery, selectedHardDrive, sortConfig, filterAndSortMovies]);

  const handleSort = (key: keyof Movie) => {
    setSortConfig(prevConfig => {
      if (prevConfig?.key === key) {
        if (prevConfig.direction === 'asc') {
          return { key, direction: 'desc' };
        } else {
          return null;
        }
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (key: keyof Movie) => {
    if (!sortConfig || sortConfig.key !== key) {
      return (
        <span className="inline-flex items-center ml-1 text-gray-400">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center ml-1 text-blue-600">
        {sortConfig.direction === 'asc' ? (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </span>
    );
  };

  const handleCreateMovie = async (data: MovieFormData) => {
    try {
      if (!session?.user) {
        throw new Error('Oturum geçersiz - Lütfen tekrar giriş yapın');
      }

      const movieData = {
        title: data.title.trim(),
        year: parseInt(data.year),
        director: data.director.trim(),
        hardDrive: data.hardDrive.trim(),
        videoQuality: data.videoQuality,
        audioQuality: data.audioQuality,
        hasSubtitles: data.hasSubtitles,
        watched: data.watched || false,
        movieLink: data.movieLink ? data.movieLink.trim() : '',
        directorLink: data.directorLink ? data.directorLink.trim() : '',
      };

      const response = await fetch('/api/admin/movies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movieData),
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Film eklenirken hata oluştu');
      }
      setIsFormOpen(false);
      loadMovies();
      toast({
        title: "Film eklendi",
        description: "Film başarıyla arşive eklendi.",
      });
    } catch (error: unknown) {
      console.error('Film eklenirken hata oluştu:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Film eklenirken hata oluştu: ${(error as Error)?.message || 'Bilinmeyen hata'}`,
      });
    }
  };

  const handleUpdateMovie = async (data: MovieFormData) => {
    if (!selectedMovie?.id) return;
    
    try {
      const updateData = {
        id: selectedMovie.id,
        title: data.title,
        year: parseInt(data.year),
        director: data.director,
        hardDrive: data.hardDrive,
        videoQuality: data.videoQuality,
        audioQuality: data.audioQuality,
        hasSubtitles: data.hasSubtitles,
        watched: data.watched || false,
        movieLink: data.movieLink,
        directorLink: data.directorLink,
      };

      const response = await fetch('/api/admin/movies', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Film güncellenirken hata oluştu');
      }
      setIsFormOpen(false);
      setSelectedMovie(null);
      loadMovies();
      toast({
        title: "Film güncellendi",
        description: "Film başarıyla güncellendi.",
      });
    } catch (error: unknown) {
      console.error('Film güncellenirken hata oluştu:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Film güncellenirken hata oluştu: ${(error as Error)?.message || 'Bilinmeyen hata'}`,
      });
    }
  };

  const handleDeleteMovie = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/movies?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Film silinirken hata oluştu');
      }
      loadMovies();
      toast({
        title: "Film silindi",
        description: "Film başarıyla arşivden silindi.",
      });
    } catch (error: unknown) {
      console.error('Film silinirken hata oluştu:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Film silinirken hata oluştu: ${(error as Error)?.message || 'Bilinmeyen hata'}`,
      });
    }
  };

  const handleWatchedToggle = async (id: string, watched: boolean) => {
    try {
      await movieService.updateMovieWatchedStatus(id, watched);
      
      setMovies(prevMovies => 
        prevMovies.map(movie => 
          movie.id === id ? { ...movie, watched } : movie
        )
      );
      
      toast({
        title: watched ? "Film izlendi olarak işaretlendi" : "Film izlenmedi olarak işaretlendi",
        description: "Film durumu başarıyla güncellendi.",
      });
    } catch (error: unknown) {
      console.error('Film durumu güncellenirken hata oluştu:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Film durumu güncellenirken hata oluştu: ${(error as Error)?.message || 'Bilinmeyen hata'}`,
      });
    }
  };

  const openEditForm = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsFormOpen(true);
  };

  const openCreateForm = () => {
    setSelectedMovie(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedMovie(null);
  };

  const paginatedMovies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredMovies.slice(startIndex, endIndex);
  }, [filteredMovies, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(totalMovies / itemsPerPage);
  }, [totalMovies, itemsPerPage]);

  const handlePageChange = useCallback((page: number, maintainScroll = true) => {
    const currentScrollY = window.scrollY;
    setCurrentPage(page);
    
    if (maintainScroll) {
      setTimeout(() => {
        window.scrollTo({ top: currentScrollY, behavior: 'instant' });
      }, 0);
    }
  }, []);

  const handleBulkUpdate = async () => {
    if (!bulkUpdateData.oldHardDrive || !bulkUpdateData.newHardDrive) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen eski ve yeni harddisk isimlerini girin.",
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bulkUpdateData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Toplu güncelleme sırasında hata oluştu');
      }

      setIsBulkUpdateOpen(false);
      setBulkUpdateData({ oldHardDrive: '', newHardDrive: '' });
      loadMovies();
      toast({
        title: "Toplu güncelleme tamamlandı",
        description: `${result.updatedCount} film güncellendi`,
      });
    } catch (error: unknown) {
      console.error('Toplu güncelleme hatası:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Toplu güncelleme sırasında hata oluştu: ${(error as Error)?.message || 'Bilinmeyen hata'}`,
      });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <Film className="h-12 w-12 animate-pulse mx-auto text-[#ff6b6b]" />
            <div className="absolute inset-0 h-12 w-12 mx-auto border-4 border-[#feca57] border-t-transparent rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold gradient-text">Admin paneli yükleniyor...</h2>
            <p className="text-muted-foreground">🎬 Kontrol odası hazırlanıyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 lg:mb-12 gap-4">
          <div className="space-y-2 lg:space-y-4">
            <h1 className="text-xl sm:text-2xl lg:text-5xl font-bold flex items-center gap-2 lg:gap-4 pb-2">
              <div className="relative">
                <Film className="h-5 w-5 sm:h-6 sm:w-6 lg:h-10 lg:w-10 text-[#ff6b6b] drop-shadow-lg" />
                <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-[#feca57] rounded-full animate-ping"></div>
              </div>
              <span className="gradient-text">CineCatalog</span>
              <span className="text-sm sm:text-lg lg:text-2xl text-muted-foreground">Admin</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">🎛️ Film imparatorluğunuzu yönetin</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <ThemeToggle />
            <div className="flex gap-2 flex-1 lg:flex-none">
              <Button onClick={() => router.push('/')} className="btn-secondary gap-1 px-2 sm:px-3 lg:px-4 py-2 rounded-full text-xs sm:text-sm">
                <Film className="w-3 h-3 lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">Ana Sayfa</span>
                <span className="sm:hidden">Ana Sayfa</span>
              </Button>
              <Button onClick={() => signOut()} className="btn-outline gap-1 px-2 sm:px-3 lg:px-4 py-2 rounded-full hover:bg-red-500/20 hover:text-red-400 hover:border-red-400 text-xs sm:text-sm">
                <LogOut className="w-3 h-3 lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">Çıkış</span>
                <span className="sm:hidden">Çıkış</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="search-card border-0 p-4 lg:p-6 mb-6 lg:mb-10 rounded-xl">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <div className="w-full">
                <AdminSearchInput
                  onSearch={handleSearchChange}
                  isLoading={false}
                  placeholder="Film, yönetmen veya harddisk ara..."
                />
              </div>
              <div className="w-full">
                <HardDriveFilter
                  hardDrives={Array.from(new Set(movies.map(m => m.hardDrive))).sort()}
                  selectedHardDrive={selectedHardDrive}
                  onSelect={setSelectedHardDrive}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-center sm:justify-end gap-2">
              <Button onClick={() => setIsBulkUpdateOpen(true)} className="btn-secondary gap-2 px-4 sm:px-6 py-2 rounded-full text-sm w-full sm:w-auto">
                <Film className="w-4 h-4" />
                Toplu Güncelle
              </Button>
              <Button onClick={openCreateForm} className="btn-primary gap-2 px-4 sm:px-6 py-2 rounded-full text-sm w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Film Ekle
              </Button>
            </div>
          </div>
          
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col gap-3 mb-4 px-2 sm:px-4">
            <div className="text-xs sm:text-sm text-muted-foreground text-center">
              Sayfa {currentPage} / {totalPages} - Toplam {totalMovies} film
            </div>
            <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1, false)}
                disabled={currentPage === 1}
                className="btn-outline gap-1 text-xs px-2 sm:px-3"
              >
                <span className="hidden sm:inline">⏮️ İlk</span>
                <span className="sm:hidden">⏮️</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn-outline gap-1 text-xs px-2 sm:px-3"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Önceki</span>
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  let pageNum;
                  const maxPages = 3;
                  if (totalPages <= maxPages) {
                    pageNum = i + 1;
                  } else if (currentPage <= Math.floor(maxPages/2) + 1) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - Math.floor(maxPages/2)) {
                    pageNum = totalPages - maxPages + 1 + i;
                  } else {
                    pageNum = currentPage - Math.floor(maxPages/2) + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className={`${currentPage === pageNum ? "btn-primary" : "btn-outline"} text-xs px-2 sm:px-3 min-w-[32px] sm:min-w-[36px]`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn-outline gap-1 text-xs px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Sonraki</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages, false)}
                disabled={currentPage === totalPages}
                className="btn-outline gap-1 text-xs px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Son ⏭️</span>
                <span className="sm:hidden">⏭️</span>
              </Button>
            </div>
          </div>
        )}

        <div 
          id="table-container"
          className="movie-card border-0 rounded-xl overflow-x-auto"
        >
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">İzlendi</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('title')}
                >
                  Film {getSortIcon('title')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('year')}
                >
                  Yıl {getSortIcon('year')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('director')}
                >
                  Yönetmen {getSortIcon('director')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('hardDrive')}
                >
                  Harddisk {getSortIcon('hardDrive')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('videoQuality')}
                >
                  Görüntü Kalitesi {getSortIcon('videoQuality')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('audioQuality')}
                >
                  Ses Kalitesi {getSortIcon('audioQuality')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('hasSubtitles')}
                >
                  Altyazı {getSortIcon('hasSubtitles')}
                </TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMovies.map((movie) => (
                <TableRow key={movie.id}>
                  <TableCell className="text-center">
                    <button
                      onClick={() => handleWatchedToggle(movie.id!, !movie.watched)}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 ${
                        movie.watched 
                          ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' 
                          : 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-400'
                      }`}
                      title={movie.watched ? 'İzlendi - İzlenmedi olarak işaretle' : 'İzlenmedi - İzlendi olarak işaretle'}
                    >
                      {movie.watched ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">
                    {movie.movieLink && movie.movieLink.trim() ? (
                      <a 
                        href={movie.movieLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#ff6b6b] hover:text-[#ff6b6b]/80 underline decoration-1 underline-offset-2 transition-colors cursor-pointer"
                      >
                        {movie.title}
                      </a>
                    ) : (
                      movie.title
                    )}
                  </TableCell>
                  <TableCell>{movie.year}</TableCell>
                  <TableCell>
                    {movie.directorLink ? (
                      <a 
                        href={movie.directorLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#ff6b6b] hover:text-[#ff6b6b]/80 underline decoration-1 underline-offset-2 transition-colors"
                      >
                        {movie.director}
                      </a>
                    ) : (
                      movie.director
                    )}
                  </TableCell>
                  <TableCell>{movie.hardDrive}</TableCell>
                  <TableCell>{movie.videoQuality}</TableCell>
                  <TableCell>{movie.audioQuality}</TableCell>
                  <TableCell>{movie.hasSubtitles ? '✓' : '✗'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 sm:gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditForm(movie)}
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                      >
                        <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0 sm:h-9 sm:w-9">
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Filmi Sil</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              &quot;{movie.title}&quot; filmini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-card border-border text-foreground hover:bg-accent">İptal</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-500 hover:bg-red-600 text-white border-red-500"
                              onClick={() => movie.id && handleDeleteMovie(movie.id)}
                            >
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4">
            <div className="text-sm text-muted-foreground">
              Toplam {totalMovies} filmden {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalMovies)} arası gösteriliyor
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1, false)}
                disabled={currentPage === 1}
                className="btn-outline gap-1"
              >
                ⏮️ İlk
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn-outline"
              >
                Önceki
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className={currentPage === pageNum ? "btn-primary" : "btn-outline"}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn-outline"
              >
                Sonraki
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages, false)}
                disabled={currentPage === totalPages}
                className="btn-outline gap-1"
              >
                Son ⏭️
              </Button>
            </div>
          </div>
        )}

        {paginatedMovies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              {totalMovies === 0 ? "Film bulunamadı." : "Bu sayfada film yok."}
            </p>
          </div>
        )}

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 bg-transparent border-0 shadow-none max-h-[95vh] overflow-hidden" showCloseButton={false}>
            <DialogHeader className="hidden">
              <DialogTitle>
                {selectedMovie ? 'Filmi Düzenle' : 'Yeni Film Ekle'}
              </DialogTitle>
            </DialogHeader>
            <MovieForm
              movie={selectedMovie || undefined}
              onSubmit={selectedMovie ? handleUpdateMovie : handleCreateMovie}
              onCancel={closeForm}
              title={selectedMovie ? 'Filmi Düzenle' : 'Yeni Film Ekle'}
              existingHardDrives={Array.from(new Set(movies.map(m => m.hardDrive))).sort()}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isBulkUpdateOpen} onOpenChange={setIsBulkUpdateOpen}>
          <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-white/20">
            <DialogHeader>
              <DialogTitle>Toplu Harddisk İsmi Güncelleme</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="oldHardDrive" className="text-sm font-medium">Eski Harddisk Adı</label>
                <select
                  id="oldHardDrive"
                  value={bulkUpdateData.oldHardDrive}
                  onChange={(e) => setBulkUpdateData(prev => ({ ...prev, oldHardDrive: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm"
                >
                  <option value="">Seçiniz</option>
                  {Array.from(new Set(movies.map(m => m.hardDrive))).sort().map(hd => (
                    <option key={hd} value={hd} className="bg-gray-800 text-white">{hd}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="newHardDrive" className="text-sm font-medium">Yeni Harddisk Adı</label>
                <input
                  id="newHardDrive"
                  type="text"
                  value={bulkUpdateData.newHardDrive}
                  onChange={(e) => setBulkUpdateData(prev => ({ ...prev, newHardDrive: e.target.value }))}
                  placeholder="Yeni harddisk adını girin"
                  className="flex h-10 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsBulkUpdateOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleBulkUpdate} className="btn-primary">
                  Güncelle
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}