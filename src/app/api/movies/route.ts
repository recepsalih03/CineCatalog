// route.ts
import { NextRequest, NextResponse } from 'next/server';
import { movieServiceAdmin } from '@/lib/movieServiceAdmin';
import { Movie } from '@/types/movie';

const clean = (val?: string): string =>
  (val || '')
    .replace(/…/g, '...')
    .replace(/%20/g, ' ')
    .replace(/%([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/[<>"'\u2028\u2029\u200B\n\r]/g, '')
    .trim();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (Array.isArray(body)) {
      const results: Array<{ index: number; id: string; title: string; success: boolean }> = [];
      const errors: Array<{ index: number; error: string; data: unknown }> = [];
      const BATCH_SIZE = 50;

      for (let batchStart = 0; batchStart < body.length; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, body.length);
        const batch = body.slice(batchStart, batchEnd);

        for (let i = 0; i < batch.length; i++) {
          const actualIndex = batchStart + i;
          try {
            const movieData = batch[i];

            const title = clean(movieData.title || movieData['film adı'] || movieData['Film Adı']);
            const director = clean(movieData.director || movieData['yönetmen adı'] || movieData['Yönetmen Adı'] || 'Bilinmiyor');
            const year = clean(movieData.year || movieData['yıl'] || movieData['Yıl']);
            const hardDrive = clean(movieData.hardDrive || movieData['harddisk'] || movieData['Harddisk']);
            const videoQuality = clean(movieData.videoQuality || movieData['görüntü kalitesi'] || movieData['Görüntü Kalitesi']);
            const audioQuality = clean(movieData.audioQuality || movieData['ses kalitesi'] || movieData['Ses Kalitesi']);
            const subtitles = movieData.hasSubtitles || movieData.altyazı || movieData['altyazı'] || movieData['Altyazı'];
            const movieLinkRaw = movieData.movieLink || movieData['film linki'] || movieData['Film Linki'] || '';
            const directorLinkRaw = movieData.directorLink || movieData['yönetmen linki'] || movieData['Yönetmen Linki'] || '';

            if (!title) {
              errors.push({ index: actualIndex, error: `Film adı gereklidir`, data: movieData });
              continue;
            }

            let yearNum = 0;
            if (year) {
              yearNum = parseInt(year);
              if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 5) {
                errors.push({ index: actualIndex, error: 'Geçerli bir yıl giriniz (1900-' + (new Date().getFullYear() + 5) + ')', data: movieData });
                continue;
              }
            }

            let hasSubtitles = false;
            if (typeof subtitles === 'boolean') {
              hasSubtitles = subtitles;
            } else if (typeof subtitles === 'string') {
              const subStr = subtitles.toLowerCase();
              hasSubtitles = ['var', 'true', 'evet', 'yes'].includes(subStr);
            }

            let safeMovieLink = '';
            let safeDirectorLink = '';
            try {
              if (movieLinkRaw?.trim()) {
                new URL(movieLinkRaw.trim());
                safeMovieLink = movieLinkRaw.trim();
              }
            } catch {}
            try {
              if (directorLinkRaw?.trim()) {
                const decodedUrl = decodeURIComponent(directorLinkRaw.trim());
                new URL(decodedUrl);
                safeDirectorLink = decodedUrl;
              }
            } catch {
              safeDirectorLink = clean(directorLinkRaw);
            }

            const isDuplicate = results.some(result => result.title.toLowerCase() === title.toLowerCase());
            if (isDuplicate) {
              errors.push({ index: actualIndex, error: `Duplicate film found: "${title}"`, data: movieData });
              continue;
            }

            const movieToCreate: Omit<Movie, 'id' | 'createdAt' | 'updatedAt'> = {
              title,
              year: yearNum,
              director,
              hardDrive,
              videoQuality,
              audioQuality,
              hasSubtitles,
              movieLink: safeMovieLink,
              directorLink: safeDirectorLink,
            };

            try {
              const movieId = await movieServiceAdmin.createMovie(movieToCreate);
              results.push({ index: actualIndex, id: movieId, title: movieToCreate.title, success: true });
            } catch {
              errors.push({ index: actualIndex, error: 'Database error', data: movieData });
              continue;
            }
          } catch {
            errors.push({ index: actualIndex, error: 'Bilinmeyen hata', data: batch[i] });
          }
        }

        if (batchStart + BATCH_SIZE < body.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
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
      const title = clean(body.title || body['film adı'] || body['Film Adı']);
      const director = clean(body.director || body['yönetmen adı'] || body['Yönetmen Adı'] || 'Bilinmiyor');
      const year = clean(body.year || body['yıl'] || body['Yıl']);
      const hardDrive = clean(body.hardDrive || body['harddisk'] || body['Harddisk']);
      const videoQuality = clean(body.videoQuality || body['görüntü kalitesi'] || body['Görüntü Kalitesi']);
      const audioQuality = clean(body.audioQuality || body['ses kalitesi'] || body['Ses Kalitesi']);
      const subtitles = body.hasSubtitles || body.altyazı || body['altyazı'] || body['Altyazı'];
      const movieLink = clean(body.movieLink || body['film linki'] || body['Film Linki']);
      const directorLink = clean(body.directorLink || body['yönetmen linki'] || body['Yönetmen Linki']);

      if (!title) {
        return NextResponse.json({ error: 'Film adı gereklidir' }, { status: 400 });
      }

      let yearNum = 0;
      if (year) {
        yearNum = parseInt(year);
        if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 5) {
          return NextResponse.json({ error: 'Geçerli bir yıl giriniz (1900-' + (new Date().getFullYear() + 5) + ')' }, { status: 400 });
        }
      }

      let hasSubtitles = false;
      if (typeof subtitles === 'boolean') {
        hasSubtitles = subtitles;
      } else if (typeof subtitles === 'string') {
        const subStr = subtitles.toLowerCase();
        hasSubtitles = ['var', 'true', 'evet', 'yes'].includes(subStr);
      }

      const movieToCreate: Omit<Movie, 'id' | 'createdAt' | 'updatedAt'> = {
        title,
        year: yearNum,
        director,
        hardDrive,
        videoQuality,
        audioQuality,
        hasSubtitles,
        movieLink,
        directorLink,
      };

      const movieId = await movieServiceAdmin.createMovie(movieToCreate);

      return NextResponse.json({
        success: true,
        id: movieId,
        message: 'Film başarıyla eklendi'
      });
    }
  } catch {
    return NextResponse.json({ error: 'İşlem sırasında hata oluştu', success: false }, { status: 500 });
  }
}

export async function GET() {
  try {
    const movies = await movieServiceAdmin.getAllMovies();
    return NextResponse.json({ success: true, data: movies });
  } catch {
    return NextResponse.json({ error: 'Filmler yüklenirken hata oluştu', success: false }, { status: 500 });
  }
}