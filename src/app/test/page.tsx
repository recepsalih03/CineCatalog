// app/test/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { getApp, getApps } from 'firebase/app';
import { getFirestore, collection, getCountFromServer } from 'firebase/firestore';
import app from '@/lib/firebase';

/**
 * FirestoreDiagnosticPage
 * -----------------------
 * Bu sayfa açıldığında:
 * 1. Yüklü Firebase App'i bulur ve ekranda config'ini (projectId, apiKey, authDomain) gösterir.
 * 2. Firestore'daki "movies" koleksiyonunun **server-side** gerçek belge sayısını getirir.
 * 3. Başarılıysa yeşil, hatalıysa kırmızı sonuç döner.
 * Böylece doğru projeye mi bağlanıyoruz, kural mı engelliyor net görülür.
 */
export default function FirestoreDiagnosticPage() {
  const [info, setInfo] = useState<{
    projectId: string;
    apiKey: string;
    authDomain: string;
    status: string;
    count?: number;
  } | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        // 1️⃣ App config
        const cfg = (getApps()[0] ?? getApp()).options as any;

        // 2️⃣ Belge sayısı (sunucudan)
        const db = getFirestore(app);
        const snap = await getCountFromServer(collection(db, 'movies'));

        setInfo({
          projectId: cfg.projectId,
          apiKey: cfg.apiKey,
          authDomain: cfg.authDomain,
          status: 'success',
          count: snap.data().count,
        });
      } catch (err) {
        console.error('🔥 Diagnostic error', err);
        const e = err as { code?: string; message?: string };
        const cfg = (getApps()[0] ?? {}).options ?? {};
        setInfo({
          projectId: cfg.projectId ?? 'n/a',
          apiKey: cfg.apiKey ?? 'n/a',
          authDomain: cfg.authDomain ?? 'n/a',
          status: `error: ${e.code ?? 'unknown'}`,
        });
      }
    };
    run();
  }, []);

  if (!info) return <p style={{ padding: '2rem' }}>Running diagnostics…</p>;

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: '1rem' }}>Firestore Diagnostic</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li><strong>projectId:</strong> {info.projectId}</li>
        <li><strong>authDomain:</strong> {info.authDomain}</li>
        <li><strong>apiKey:</strong> {info.apiKey}</li>
        <li>
          <strong>Result:</strong>{' '}
          {info.status === 'success' ? (
            <span style={{ color: 'green' }}>✅ {info.count} documents</span>
          ) : (
            <span style={{ color: 'red' }}>❌ {info.status}</span>
          )}
        </li>
      </ul>
    </main>
  );
}
