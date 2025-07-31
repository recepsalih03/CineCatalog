import { NextRequest, NextResponse } from 'next/server';
import { movieServiceAdmin } from '@/lib/movieServiceAdmin';
import { getServerSession } from 'next-auth';

// Admin user validation
function isValidAdmin(session: { user?: { name?: string | null } } | null): boolean {
  if (!session?.user?.name) {
    console.log('❌ Admin validation failed: No session user name');
    return false;
  }
  
  // Basit admin kontrolü - sadece ADMIN_USERNAME ile karşılaştır
  const adminUsername = process.env.ADMIN_USERNAME || '';
  const isValid = session.user.name.toLowerCase() === adminUsername.toLowerCase();
  
  console.log('🔐 Admin validation:', {
    sessionUserName: session.user.name,
    adminUsername,
    isValid
  });
  
  return isValid;
}

// Rate limiting (basit implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // requests per minute
const WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const userLimit = requestCounts.get(identifier);
  
  if (!userLimit || now > userLimit.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// POST - Create movie
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Session kontrolü
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Admin kontrolü
    if (!isValidAdmin(session)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Rate limiting
    const identifier = session.user.name || 'unknown';
    if (!checkRateLimit(identifier)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    
    // Input validation
    if (!body.title || !body.director || !body.hardDrive || !body.year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (typeof body.year !== 'number' || body.year < 1800 || body.year > 2030) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
    }
    
    if (body.title.length > 200 || body.director.length > 100) {
      return NextResponse.json({ error: 'Field too long' }, { status: 400 });
    }
    
    const movieData = {
      title: body.title.trim(),
      year: body.year,
      director: body.director.trim(),
      hardDrive: body.hardDrive.trim(),
      videoQuality: (body.videoQuality || '').trim(),
      audioQuality: (body.audioQuality || '').trim(),
      hasSubtitles: body.hasSubtitles || false,
      movieLink: (body.movieLink || '').trim(),
      directorLink: (body.directorLink || '').trim(),
    };

    const movieId = await movieServiceAdmin.createMovie(movieData);

    return NextResponse.json({
      success: true,
      id: movieId,
      message: 'Film başarıyla eklendi'
    });
  } catch (error) {
    console.error('Movie creation error:', error);
    return NextResponse.json({ 
      error: 'Film eklenirken hata oluştu', 
      success: false 
    }, { status: 500 });
  }
}

// PUT - Update movie
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!isValidAdmin(session)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const identifier = session.user.name || 'unknown';
    if (!checkRateLimit(identifier)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const { id, ...movieData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Movie ID required' }, { status: 400 });
    }

    await movieServiceAdmin.updateMovie(id, movieData);

    return NextResponse.json({
      success: true,
      message: 'Film başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Movie update error:', error);
    return NextResponse.json({ 
      error: 'Film güncellenirken hata oluştu', 
      success: false 
    }, { status: 500 });
  }
}

// DELETE - Delete movie
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!isValidAdmin(session)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const identifier = session.user.name || 'unknown';
    if (!checkRateLimit(identifier)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Movie ID required' }, { status: 400 });
    }

    await movieServiceAdmin.deleteMovie(id);

    return NextResponse.json({
      success: true,
      message: 'Film başarıyla silindi'
    });
  } catch (error) {
    console.error('Movie deletion error:', error);
    return NextResponse.json({ 
      error: 'Film silinirken hata oluştu', 
      success: false 
    }, { status: 500 });
  }
}