'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, User, Loader2, ArrowRight, Database } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [dbConnected, setDbConnected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('coordinators').select('id').limit(1);
        if (!error) setDbConnected(true);
      } catch (e) {
        setDbConnected(false);
      }
    };
    checkConnection();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const cleanEmail = email.trim();
      
      // 1. Coba login pakai sistem bawaan Supabase Auth dulu (Jika user mendaftar via Authentication di Supabase)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      let userEmail = cleanEmail;
      let userRole = 'operation'; // Default fallback role

      // 2. Jika gagal pakai Auth bawaan, coba cek manual ke tabel 'coordinators' (MVP)
      if (authError || !authData?.user) {
        // HANYA CEK EMAIL DULU
        const { data: dbData, error: dbError } = await supabase
          .from('coordinators')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (dbError) {
          console.error("DB Error:", dbError?.message);
          setErrorMsg(`Gagal Tabel: Error koneksi atau policy (${dbError.message})`);
          setLoading(false);
          return;
        }

        if (!dbData) {
          // Email benar-benar tidak ada di tabel
          setErrorMsg(`Email "${cleanEmail}" belum terdaftar di database! Pastikan Anda sudah menjalankan SQL INSERT-nya di Supabase.`);
          setLoading(false);
          return;
        }

        // Jika email ada, cek passwordnya secara manual di kode
        if (dbData.password !== password) {
          setErrorMsg(`Password salah! Anda mengetik: "${password}", sedangkan di database terdaftar password yang berbeda.`);
          setLoading(false);
          return;
        }

        // JIKA KEDUANYA BENAR:
        userRole = dbData.role;
      } else {
        // Jika pakai Auth, coba ambil role dari tabel jika ada
        const { data: roleData } = await supabase.from('coordinators').select('role').eq('email', cleanEmail).maybeSingle();
        if (roleData) userRole = roleData.role;
      }

      // SIMPAN SESI SECARA SEMENTARA (HILANG SAAT BROWSER DITUTUP)
      sessionStorage.setItem('auth_session', JSON.stringify({ email: userEmail, role: userRole }));
      
      // Redirect to dashboard
      router.push('/');
    } catch (err) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan sistem. Coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem', position: 'relative', overflow: 'hidden' }}>
        
        {/* Dekorasi Aksent */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <Lock size={28} style={{ color: 'var(--primary)' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem 0', letterSpacing: '-0.025em' }}>
            Portal Akses
          </h1>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.6rem', background: dbConnected ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${dbConnected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: '999px', marginBottom: '1rem' }}>
            <Database size={12} style={{ color: dbConnected ? '#34d399' : '#f87171' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: dbConnected ? '#34d399' : '#f87171' }}>
              {dbConnected ? 'Terhubung ke Supabase' : 'Koneksi Database Terputus'}
            </span>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
            Masuk dengan akun koordinator Anda.
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {errorMsg && (
            <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#f87171', fontSize: '0.85rem', textAlign: 'center', fontWeight: 500 }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="email"
                placeholder="email@perusahaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%', padding: '0.8rem 1rem 0.8rem 2.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s ease',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'rgba(0,0,0,0.3)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(0,0,0,0.2)'; }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%', padding: '0.8rem 1rem 0.8rem 2.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s ease',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'rgba(0,0,0,0.3)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(0,0,0,0.2)'; }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '0.85rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
            }}
            onMouseEnter={e => { if(!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { if(!loading) e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : (
              <>
                Masuk <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
