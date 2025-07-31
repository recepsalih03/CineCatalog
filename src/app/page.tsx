"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { movieService } from "@/lib/movieService"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Film, Settings, HardDrive } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import MovieGrid from "@/components/MovieGrid"
import SearchAndFilters from "@/components/SearchAndFilters"
import type { Movie } from "@/types/movie"

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [hardDrives, setHardDrives] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const loadMoviesData = useCallback(async () => {
    try {
      setLoading(true)
      const [moviesData, hardDrivesData] = await Promise.all([
        movieService.getAllMovies(),
        movieService.getUniqueHardDrives()
      ])
      setMovies(moviesData)
      setHardDrives(hardDrivesData)
    } catch (error) {
      console.error("Failed to load movies:", error)
      setMovies([])
      setHardDrives([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMoviesData()
  }, [loadMoviesData])

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const startPolling = () => {
      intervalId = setInterval(() => {
        loadMoviesData()
      }, 30000) // Her 30 saniyede bir kontrol et
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadMoviesData()
        startPolling()
      } else {
        clearInterval(intervalId)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    startPolling()

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [loadMoviesData])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <Film className="h-12 w-12 animate-pulse mx-auto text-[#ff6b6b]" />
            <div className="absolute inset-0 h-12 w-12 mx-auto border-4 border-[#feca57] border-t-transparent rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold gradient-text">Katalog yükleniyor...</h2>
            <p className="text-muted-foreground">🎬 Film koleksiyonunuz hazırlanıyor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 lg:mb-12 gap-4 lg:gap-6">
          <div className="space-y-2 lg:space-y-4">
            <h1 className="text-2xl sm:text-3xl lg:text-6xl font-bold flex items-center gap-2 lg:gap-4 pb-2">
              <div className="relative">
                <Film className="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 text-[#ff6b6b] drop-shadow-lg" />
                <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 bg-[#feca57] rounded-full animate-ping"></div>
              </div>
              <span className="gradient-text">CineCatalog</span>
            </h1>
            <p className="text-sm sm:text-lg lg:text-xl text-muted-foreground">🍿 Premium film koleksiyonunuz</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 w-full lg:w-auto">
            <ThemeToggle />
            <Link href="/admin" className="flex-1 lg:flex-none">
              <Button className="btn-primary gap-2 lg:gap-3 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 text-xs sm:text-sm lg:text-lg rounded-full w-full lg:w-auto">
                <Settings className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                <span className="hidden sm:inline">Admin Paneli</span>
                <span className="sm:hidden">Admin</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 search-card rounded-lg p-4 border-0">
            <div className="flex items-center gap-3">
              <Film className="h-5 w-5 text-[#ff6b6b]" />
              <p className="text-foreground font-medium">
                <span className="font-bold text-[#feca57]">{movies.length}</span> film koleksiyonunuzda
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {hardDrives.length > 0 && (
                <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground">
                  <HardDrive className="h-3 w-3 text-[#feca57]" />
                  <span className="whitespace-nowrap">{hardDrives.length} harddisk</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters - Client Component */}
        <Suspense fallback={
          <Card className="search-card mb-6 lg:mb-10 border-0">
            <CardContent className="pt-6 pb-6 lg:pt-8 lg:pb-8">
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        }>
          <SearchAndFilters hardDrives={hardDrives} />
        </Suspense>

        {/* Movie Grid - Client Component with Server Data */}
        <Suspense fallback={
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="mt-2 space-y-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        }>
          <MovieGrid initialMovies={movies} />
        </Suspense>
      </div>
    </div>
  )
}
