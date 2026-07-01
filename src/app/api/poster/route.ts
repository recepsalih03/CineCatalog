import { NextRequest, NextResponse } from 'next/server';
import { extractImdbId, resolveImdbPosterUrl } from '@/lib/posterResolver';

// GET /api/poster?link=<imdb film linki>
// IMDb linkinden poster URL'ini çözer. Sonuç CDN/tarayıcı tarafında önbelleklenir.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const link = searchParams.get('link') || '';

  const imdbId = extractImdbId(link);
  if (!imdbId) {
    return NextResponse.json(
      { success: false, error: 'Geçerli bir IMDb linki değil' },
      { status: 400 }
    );
  }

  const posterUrl = await resolveImdbPosterUrl(imdbId);

  return NextResponse.json(
    { success: !!posterUrl, posterUrl },
    {
      status: 200,
      headers: {
        // Bulunduysa 1 gün, bulunamadıysa 1 saat önbellekle
        'Cache-Control': posterUrl
          ? 'public, max-age=86400, s-maxage=86400'
          : 'public, max-age=3600',
      },
    }
  );
}
