// IMDb poster çözümleyici.
// turkcealtyazi.org posterleri link kalıbından senkron üretilebilir (bkz. movieService),
// ancak IMDb poster URL'leri ID'den tahmin edilemez. Bu yüzden IMDb'nin herkese açık,
// anahtar gerektirmeyen "suggestion" ucundan posteri sunucu tarafında çözeriz.

const SUGGESTION_ENDPOINT = 'https://v2.sg.media-imdb.com/suggestion/t';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 saat
const posterCache = new Map<string, { url: string | null; expiresAt: number }>();

/**
 * Bir IMDb linkinden (ör. https://www.imdb.com/title/tt0478970/) IMDb ID'sini çıkarır.
 * IMDb linki değilse null döner.
 */
export function extractImdbId(link?: string): string | null {
  if (!link || !/imdb\.com/i.test(link)) {
    return null;
  }
  const match = link.match(/tt\d{6,}/i);
  return match ? match[0].toLowerCase() : null;
}

/**
 * IMDb poster görsellerini grid için daha küçük ve hafif bir boyuta indirir.
 * (ör. ..._V1_.jpg -> ..._V1_QL75_UX380_.jpg ~ 4x daha küçük dosya)
 */
function optimizeImageUrl(imageUrl: string): string {
  return imageUrl.replace(/\._V1_.*?(\.\w+)$/i, '._V1_QL75_UX380_$1');
}

/**
 * Bir IMDb ID'si için poster URL'ini çözer. Anahtar gerektirmez.
 * Sonuç 24 saat bellek içinde önbelleklenir.
 */
export async function resolveImdbPosterUrl(imdbId: string): Promise<string | null> {
  if (!/^tt\d{6,}$/i.test(imdbId)) {
    return null;
  }

  const cached = posterCache.get(imdbId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  let posterUrl: string | null = null;
  try {
    const res = await fetch(`${SUGGESTION_ENDPOINT}/${imdbId}.json`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const data = (await res.json()) as { d?: Array<{ id?: string; i?: { imageUrl?: string } }> };
      const list = Array.isArray(data?.d) ? data.d : [];
      const match = list.find((entry) => entry?.id === imdbId) ?? list[0];
      const imageUrl = match?.i?.imageUrl;

      if (typeof imageUrl === 'string' && imageUrl.startsWith('https://m.media-amazon.com/')) {
        posterUrl = optimizeImageUrl(imageUrl);
      }
    }
  } catch (error) {
    console.warn('IMDb poster çözümlenemedi:', imdbId, error);
  }

  posterCache.set(imdbId, { url: posterUrl, expiresAt: Date.now() + CACHE_TTL_MS });
  return posterUrl;
}
