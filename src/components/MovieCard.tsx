"use client"

import type React from "react"
import { memo, useEffect, useState } from "react"
import type { Movie } from "@/types/movie"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Film, HardDrive, User, Volume2, Subtitles, Eye } from "lucide-react"

interface MovieCardProps {
  movie: Movie
}

const formatAudioQuality = (quality: string | undefined): string => {
  if (!quality) return "-"

  return quality
    .replace(/TRUE HD/gi, "TrueHD")
    .replace(/TRUEHD/gi, "TrueHD")
}

const isImdbLink = (link?: string): boolean =>
  !!link && /imdb\.com/i.test(link) && /tt\d{6,}/i.test(link)

const MovieCard = memo(function MovieCard({ movie }: MovieCardProps) {
  const [imdbPoster, setImdbPoster] = useState<string | null>(null)

  // turkcealtyazi posterleri link kalıbından üretilir (movieService).
  // IMDb linkleri için posteri /api/poster üzerinden çözüp ekleriz.
  useEffect(() => {
    if (movie.posterUrl || !isImdbLink(movie.movieLink)) return

    let active = true
    fetch(`/api/poster?link=${encodeURIComponent(movie.movieLink!)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.posterUrl) setImdbPoster(data.posterUrl)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [movie.posterUrl, movie.movieLink])

  const posterUrl = movie.posterUrl || imdbPoster || undefined

  return (
    <Card className={`movie-card border-0 p-4 gap-2 relative overflow-hidden ${movie.watched ? 'ring-1 ring-green-400/30' : ''} ${!posterUrl ? 'min-h-40 sm:min-h-80' : ''}`}>
      {movie.watched && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
      )}

      {movie.watched && (
        <div className="pointer-events-none absolute right-[-40px] top-[20px] z-20 w-[140px] rotate-45 bg-green-600 py-1 text-center shadow-md">
          <span className="flex items-center justify-center gap-1 text-[10px] font-bold leading-none text-white">
            <Eye className="h-3 w-3" />
            İzlendi
          </span>
        </div>
      )}

      {posterUrl && (
        <div className="relative z-10 w-full aspect-[2/3] overflow-hidden rounded-t-lg">
          <img
            src={posterUrl}
            alt={`${movie.title} poster`}
            className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <CardContent className={`px-5 py-0 flex flex-col relative z-10 ${!posterUrl ? 'justify-center h-full' : ''}`}>
        <div className="flex items-end gap-2 mb-1 min-h-[38px]">
          <Film className="h-4 w-4 text-[#ff6b6b] shrink-0" />
          <Badge
            variant="secondary"
            className="text-xs bg-[#ff6b6b]/20 text-[#ff6b6b] border-[#ff6b6b]/30 rounded-md sm:rounded-full text-center leading-tight"
          >
            {movie.videoQuality || "HD"}
          </Badge>
        </div>

        <div className="space-y-1">
          <div>
            <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-tight mb-0.5">
              {movie.movieLink && movie.movieLink.trim() ? (
                <a 
                  href={movie.movieLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-[#ff6b6b] transition-colors cursor-pointer"
                >
                  {movie.title}
                </a>
              ) : (
                movie.title
              )}
            </h3>
            <div className="text-xs text-[#feca57] font-medium">{movie.year}</div>
          </div>
          
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1 text-foreground">
              <User className="h-3 w-3 text-[#feca57] flex-shrink-0" />
              <span className="truncate">
                {movie.directorLink && movie.directorLink.trim() ? (
                  <a 
                    href={movie.directorLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-[#ff6b6b] transition-colors cursor-pointer"
                  >
                    {movie.director}
                  </a>
                ) : (
                  movie.director
                )}
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-foreground">
              <HardDrive className="h-3 w-3 text-[#ff6b6b] flex-shrink-0" />
              <span className="truncate">{movie.hardDrive}</span>
            </div>
          </div>

          <div className="space-y-1 pt-1 border-t border-white/10">
            <div className="flex items-center gap-1">
              <Volume2 className="h-3 w-3 text-[#feca57] flex-shrink-0" />
              <span className="text-xs text-foreground">
                {formatAudioQuality(movie.audioQuality)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Subtitles className="h-3 w-3 text-[#ff6b6b] flex-shrink-0" />
              <span className={`text-xs font-bold ${movie.hasSubtitles ? "text-green-400" : "text-red-400"}`}>
                {movie.hasSubtitles ? "✓ VAR" : "✗ YOK"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

export default MovieCard