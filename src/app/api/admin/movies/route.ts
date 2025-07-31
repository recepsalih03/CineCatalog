import { NextRequest, NextResponse } from 'next/server';
import { movieServiceAdmin } from '@/lib/movieServiceAdmin';
import { getServerSession } from 'next-auth';
import { Movie } from '@/types/movie';

// POST - Create movie
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const movieData = {
      title: body.title,
      year: body.year,
      director: body.director,
      hardDrive: body.hardDrive,
      videoQuality: body.videoQuality || '',
      audioQuality: body.audioQuality || '',
      hasSubtitles: body.hasSubtitles || false,
      movieLink: body.movieLink || '',
      directorLink: body.directorLink || '',
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