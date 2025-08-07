"use client"

import type React from "react"
import { memo } from "react"
import type { Movie } from "@/types/movie"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Film, HardDrive, User, Volume2, Subtitles, Eye, EyeOff } from "lucide-react"

interface MovieCardProps {
  movie: Movie
}

const MovieCard = memo(function MovieCard({ movie }: MovieCardProps) {
  return (
    <Card className={`movie-card border-0 p-4 relative overflow-hidden ${movie.watched ? 'ring-1 ring-green-400/30' : ''} ${!movie.posterUrl ? 'min-h-40 sm:min-h-80' : ''}`}>
      {movie.watched && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
      )}
      
      {movie.posterUrl && (
        <div className="w-full aspect-[2/3] overflow-hidden rounded-t-lg">
          <img 
            src={movie.posterUrl} 
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
      
      <CardContent className={`px-5 py-0 flex flex-col relative z-10 ${!movie.posterUrl ? 'justify-center h-full' : ''}`}>
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-[#ff6b6b]" />
            {movie.watched && (
              <Badge 
                variant="outline"
                className="text-xs bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-400/30 px-2 py-1 animate-pulse shadow-sm"
              >
                <Eye className="h-3 w-3 mr-1" />
                İzlendi
              </Badge>
            )}
          </div>
          <Badge 
            variant="secondary" 
            className="text-xs bg-[#ff6b6b]/20 text-[#ff6b6b] border-[#ff6b6b]/30"
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

          <div className="grid grid-cols-2 gap-1 pt-1 border-t border-white/10">
            <div className="flex items-center gap-1">
              <Volume2 className="h-3 w-3 text-[#feca57]" />
              <span className="text-xs text-foreground truncate">
                {movie.audioQuality || "-"}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Subtitles className="h-3 w-3 text-[#ff6b6b]" />
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