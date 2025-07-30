"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import type { Movie } from "@/types/movie"
import MovieCard from "@/components/MovieCard"
import { Button } from "@/components/ui/button"
import { Film, Search, ChevronLeft, ChevronRight } from "lucide-react"

interface MovieGridProps {
  initialMovies: Movie[]
}

export default function MovieGrid({ initialMovies }: MovieGridProps) {
  const searchParams = useSearchParams()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(30)

  const searchQuery = searchParams.get('search') || ""
  const selectedHardDrive = searchParams.get('hardDrive') || ""

  // Filter movies based on URL parameters
  const filteredMovies = useMemo(() => {
    let filtered = initialMovies

    if (searchQuery && searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (movie) =>
          movie.title.toLowerCase().includes(searchLower) ||
          movie.director.toLowerCase().includes(searchLower) ||
          movie.hardDrive.toLowerCase().includes(searchLower)
      )
    }

    if (selectedHardDrive) {
      filtered = filtered.filter((movie) => movie.hardDrive === selectedHardDrive)
    }

    return filtered
  }, [initialMovies, searchQuery, selectedHardDrive])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedHardDrive])

  const paginatedMovies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredMovies.slice(startIndex, endIndex)
  }, [filteredMovies, currentPage, itemsPerPage])

  const totalPages = useMemo(() => {
    return Math.ceil(filteredMovies.length / itemsPerPage)
  }, [filteredMovies.length, itemsPerPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goToFirstPage = () => {
    setCurrentPage(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goToLastPage = () => {
    setCurrentPage(totalPages)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (paginatedMovies.length === 0) {
    return (
      <div className="text-center py-12">
        {filteredMovies.length === 0 && initialMovies.length === 0 ? (
          <div className="space-y-4">
            <Film className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Henüz katalogunuzda film yok</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Admin paneli üzerinden film ekleyerek koleksiyonunuzu oluşturmaya başlayın.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Search className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Aramanızla eşleşen film bulunamadı</h3>
              <p className="text-muted-foreground">
                Aradığınızı bulmak için arama terimlerinizi veya filtrelerinizi ayarlamayı deneyin.
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Results Summary */}
      <div className="mb-6 text-center">
        <p className="text-muted-foreground">
          {filteredMovies.length === initialMovies.length ? (
            <>
              <span className="font-bold text-[#feca57]">{filteredMovies.length}</span> film gösteriliyor
            </>
          ) : (
            <>
              <span className="font-bold text-[#feca57]">{filteredMovies.length}</span> / <span className="font-bold text-[#feca57]">{initialMovies.length}</span> film bulundu
            </>
          )}
        </p>
      </div>

      {/* Movie Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {paginatedMovies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 mt-6 px-2 sm:px-4">
          <div className="text-xs sm:text-sm text-muted-foreground text-center">
            Sayfa {currentPage} / {totalPages} - Toplam {filteredMovies.length} film
          </div>
          <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={goToFirstPage}
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
            
            {/* Page numbers - show fewer on mobile */}
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
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              className="btn-outline gap-1 text-xs px-2 sm:px-3"
            >
              <span className="hidden sm:inline">Son ⏭️</span>
              <span className="sm:hidden">⏭️</span>
            </Button>
          </div>
        </div>
      )}
    </>
  )
}