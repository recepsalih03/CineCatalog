import { NextRequest, NextResponse } from 'next/server';
import { movieServiceAdmin } from '@/lib/movieServiceAdmin';
import { getServerSession } from 'next-auth';

function isValidAdmin(session: { user?: { name?: string | null } } | null): boolean {
  if (!session?.user?.name) {
    console.log('❌ Admin validation failed: No session user name');
    return false;
  }

  const adminUsername = process.env.ADMIN_USERNAME || '';
  const isValid = session.user.name.toLowerCase() === adminUsername.toLowerCase();
  
  return isValid;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!isValidAdmin(session)) {
      return NextResponse.json({ error: 'Çıkış yapıp tekrar giriş yapın.' }, { status: 403 });
    }

    const body = await request.json();
    const { oldHardDrive, newHardDrive } = body;

    if (!oldHardDrive || !newHardDrive) {
      return NextResponse.json({ error: 'Eski ve yeni harddisk isimleri gerekli' }, { status: 400 });
    }

    const result = await movieServiceAdmin.bulkUpdateHardDrive(oldHardDrive, newHardDrive);

    return NextResponse.json({ 
      success: true,
      message: `Başarıyla ${result.updatedCount} filmin hardDrive değeri güncellendi`,
      updatedCount: result.updatedCount,
      oldValue: oldHardDrive,
      newValue: newHardDrive
    });

  } catch (error) {
    console.error('❌ Bulk update API error:', error);
    return NextResponse.json({ 
      error: 'Toplu güncelleme sırasında hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 });
  }
}