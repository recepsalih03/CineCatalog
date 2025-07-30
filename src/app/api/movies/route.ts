import { NextRequest, NextResponse } from 'next/server';
import { movieService } from '@/lib/movieService';
import { Movie } from '@/types/movie';

export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    
    if (Array.isArray(body)) {
      const results = [];
      const errors = [];
      
      for (let i = 0; i < body.length; i++) {
        try {
          const movieData = body[i];
          
          // Türkçe ve İngilizce field isimlerini destekle
          const title = movieData.title || movieData['film adı'] || movieData['Film Adı'] || '';
          const director = movieData.director || movieData['yönetmen adı'] || movieData['Yönetmen Adı'] || '';
          const year = movieData.year || movieData['yıl'] || movieData['Yıl'] || '';
          const hardDrive = movieData.hardDrive || movieData['harddisk'] || movieData['Harddisk'] || '';
          const videoQuality = movieData.videoQuality || movieData['görüntü kalitesi'] || movieData['Görüntü Kalitesi'] || '';
          const audioQuality = movieData.audioQuality || movieData['ses kalitesi'] || movieData['Ses Kalitesi'] || '';
          const subtitles = movieData.hasSubtitles || movieData.altyazı || movieData['altyazı'] || movieData['Altyazı'];
          const movieLink = movieData.movieLink || movieData['film linki'] || movieData['Film Linki'] || '';
          const directorLink = movieData.directorLink || movieData['yönetmen linki'] || movieData['Yönetmen Linki'] || '';
          
          console.log('Processing movie:', { title, director, year, hardDrive }); // Debug log
          
          if (!title?.trim() || !director?.trim() || !year) {
            errors.push({
              index: i,
              error: `Film adı, yönetmen ve yıl alanları gereklidir. Alınan: title="${title}", director="${director}", year="${year}"`,
              data: movieData
            });
            continue;
          }

          const yearNum = parseInt(year.toString());
          if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 5) {
            errors.push({
              index: i,
              error: 'Geçerli bir yıl giriniz',
              data: movieData
            });
            continue;
          }

          // Altyazı string değerini boolean'a çevir
          let hasSubtitles = false;
          if (typeof subtitles === 'boolean') {
            hasSubtitles = subtitles;
          } else if (typeof subtitles === 'string') {
            const subStr = subtitles.toLowerCase();
            hasSubtitles = subStr === 'var' || subStr === 'true' || subStr === 'evet' || subStr === 'yes';
          }

          // Türkçe karakterleri koruyarak güvenli field isimleri oluştur
          const safeTitle = title.trim().replace(/[<>\"\']/g, '').trim();
          const safeDirector = director.trim().replace(/[<>\"\']/g, '').trim();
          const safeHardDrive = (hardDrive?.trim() || '').replace(/[<>\"\']/g, '').trim();
          const safeVideoQuality = (videoQuality?.trim() || '').replace(/[<>\"\']/g, '').trim();
          const safeAudioQuality = (audioQuality?.trim() || '').replace(/[<>\"\']/g, '').trim();
          // URL validation
          let safeMovieLink = '';
          let safeDirectorLink = '';
          
          try {
            if (movieLink?.trim()) {
              new URL(movieLink.trim()); // URL validation
              safeMovieLink = movieLink.trim();
            }
          } catch {
            console.log(`Invalid movie URL for ${title}: ${movieLink}`);
          }
          
          try {
            if (directorLink?.trim()) {
              new URL(directorLink.trim()); // URL validation  
              safeDirectorLink = directorLink.trim();
            }
          } catch {
            console.log(`Invalid director URL for ${director}: ${directorLink}`);
          }

          // Final validation
          if (!safeTitle || !safeDirector) {
            errors.push({
              index: i,
              error: `Film adı veya yönetmen adında geçersiz karakterler var. Title: "${safeTitle}", Director: "${safeDirector}"`,
              data: movieData
            });
            continue;
          }

          const movieToCreate: Omit<Movie, 'id' | 'createdAt' | 'updatedAt'> = {
            title: safeTitle,
            year: yearNum,
            director: safeDirector,
            hardDrive: safeHardDrive,
            videoQuality: safeVideoQuality,
            audioQuality: safeAudioQuality,
            hasSubtitles: hasSubtitles,
            movieLink: safeMovieLink,
            directorLink: safeDirectorLink,
          };

          const movieId = await movieService.createMovie(movieToCreate);
          results.push({
            index: i,
            id: movieId,
            title: movieToCreate.title,
            success: true
          });
        } catch (error) {
          console.error(`Error processing movie at index ${i}:`, error);
          errors.push({
            index: i,
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
            data: body[i]
          });
        }
      }

      return NextResponse.json({
        success: results.length > 0,
        results,
        errors,
        totalProcessed: body.length,
        successCount: results.length,
        errorCount: errors.length
      });
    } else {
      // Türkçe ve İngilizce field isimlerini destekle
      const title = body.title || body['film adı'] || body['Film Adı'];
      const director = body.director || body['yönetmen adı'] || body['Yönetmen Adı'];
      const year = body.year || body['yıl'] || body['Yıl'];
      const hardDrive = body.hardDrive || body['harddisk'] || body['Harddisk'];
      const videoQuality = body.videoQuality || body['görüntü kalitesi'] || body['Görüntü Kalitesi'];
      const audioQuality = body.audioQuality || body['ses kalitesi'] || body['Ses Kalitesi'];
      const subtitles = body.hasSubtitles || body.altyazı || body['altyazı'] || body['Altyazı'];
      const movieLink = body.movieLink || body['film linki'] || body['Film Linki'];
      const directorLink = body.directorLink || body['yönetmen linki'] || body['Yönetmen Linki'];

      if (!title || !director || !year) {
        return NextResponse.json(
          { error: 'Film adı, yönetmen ve yıl alanları gereklidir' },
          { status: 400 }
        );
      }

      const yearNum = parseInt(year.toString());
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 5) {
        return NextResponse.json(
          { error: 'Geçerli bir yıl giriniz' },
          { status: 400 }
        );
      }

      // Altyazı string değerini boolean'a çevir
      let hasSubtitles = false;
      if (typeof subtitles === 'boolean') {
        hasSubtitles = subtitles;
      } else if (typeof subtitles === 'string') {
        const subStr = subtitles.toLowerCase();
        hasSubtitles = subStr === 'var' || subStr === 'true' || subStr === 'evet' || subStr === 'yes';
      }

      const movieToCreate: Omit<Movie, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        year: yearNum,
        director: director.trim(),
        hardDrive: hardDrive?.trim() || '',
        videoQuality: videoQuality?.trim() || '',
        audioQuality: audioQuality?.trim() || '',
        hasSubtitles: hasSubtitles,
        movieLink: movieLink?.trim() || '',
        directorLink: directorLink?.trim() || '',
      };

      const movieId = await movieService.createMovie(movieToCreate);
      
      return NextResponse.json({
        success: true,
        id: movieId,
        message: 'Film başarıyla eklendi'
      });
    }
  } catch (error) {
    console.error('Error in POST /api/movies:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Bilinmeyen hata oluştu',
        success: false 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const movies = await movieService.getAllMovies();
    return NextResponse.json({
      success: true,
      data: movies
    });
  } catch (error) {
    console.error('Error in GET /api/movies:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Filmler yüklenirken hata oluştu',
        success: false 
      },
      { status: 500 }
    );
  }
}