'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Film, User, Lock, Home } from 'lucide-react';
import Link from 'next/link';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!username || !password) {
      setError('Kullanıcı adı ve şifre gereklidir');
      setLoading(false);
      return;
    }

    if (username.length < 3 || password.length < 6) {
      setError('Geçersiz giriş bilgileri');
      setLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Geçersiz kullanıcı adı veya şifre');
        setTimeout(() => setError(''), 5000);
      } else if (result?.ok) {
        // Session refresh için biraz bekle
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Force refresh session
        const session = await getSession();
        if (session) {
          router.push('/admin');
          router.refresh(); // Force refresh
        } else {
          // Retry session check
          setTimeout(async () => {
            const retrySession = await getSession();
            if (retrySession) {
              router.push('/admin');
              router.refresh();
            } else {
              setError('Oturum oluşturulamadı. Sayfayı yenileyin.');
            }
          }, 1000);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Giriş işlemi sırasında hata oluştu');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 lg:top-6 lg:right-6">
        <ThemeToggle />
      </div>
      
      {/* Home Button */}
      <div className="absolute top-4 left-4 lg:top-6 lg:left-6">
        <Link href="/">
          <Button className="btn-outline gap-1 lg:gap-2 px-3 lg:px-4 py-2 rounded-full text-sm lg:text-base">
            <Home className="w-3 h-3 lg:w-4 lg:h-4" />
            <span className="hidden sm:inline">Ana Sayfa</span>
            <span className="sm:hidden">Ana</span>
          </Button>
        </Link>
      </div>

      <Card className="w-full max-w-md mx-4 lg:mx-0 movie-card border-0">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <Film className="h-8 w-8 text-[#ff6b6b] drop-shadow-lg" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#feca57] rounded-full animate-ping"></div>
            </div>
            <span className="text-2xl font-bold gradient-text">CineCatalog</span>
          </div>
          <CardTitle className="text-xl text-muted-foreground">🎬 Yönetici Erişimi</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground font-medium">Kullanıcı Adı</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#feca57]" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pl-10 bg-white/10 border-white/20 focus:border-[#feca57] focus:ring-1 focus:ring-[#feca57]"
                  placeholder="Kullanıcı adınızı girin"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">Şifre</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#ff6b6b]" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 bg-white/10 border-white/20 focus:border-[#ff6b6b] focus:ring-1 focus:ring-[#ff6b6b]"
                  placeholder="Şifrenizi girin"
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full btn-primary py-3 text-lg rounded-full" disabled={loading}>
              {loading ? '🎬 Giriş yapılıyor...' : '🚀 Yöneticiye Giriş'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}