"use client"

import type React from "react"
import { memo } from "react"
import type { Movie } from "@/types/movie"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Film, HardDrive, User, Volume2, Subtitles } from "lucide-react"

interface MovieCardProps {
  movie: Movie
}

const MovieCard = memo(function MovieCard({ movie }: MovieCardProps) {
  return (
    <Card className="movie-card border-0 h-full">
      <CardContent className="p-3 h-full flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <Film className="h-4 w-4 text-[#ff6b6b]" />
          <Badge 
            variant="secondary" 
            className="text-xs bg-[#ff6b6b]/20 text-[#ff6b6b] border-[#ff6b6b]/30"
          >
            {movie.videoQuality || "HD"}
          </Badge>
        </div>

        <div className="flex-1 space-y-2">
          <div>
            <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-tight mb-1">
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

          <div className="grid grid-cols-2 gap-1 pt-2 border-t border-white/10">
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