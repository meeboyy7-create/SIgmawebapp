  import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import MarketingPage from './MarketingPage';
import AuthModal from './AuthModal';
import LoadingScreen from './LoadingScreen';
import NotFound from './NotFound';
import MobilePrompt from './MobilePrompt';

/* ── Valid SPA paths ── */
const VALID_PATHS = new Set(['/', '/index.html']);

/* ── Mobile detection ── */
const isMobileDevice = () => {
  const ua = navigator.userAgent;
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua)
    && window.innerWidth < 1024;
};

/* ── Mobile URL — same host, /mobile path with room param ── */
const getMobileUrl = (uid) => {
  const base = `${window.location.protocol}//${window.location.host}/mobile`;
  return uid ? `${base}?room=${encodeURIComponent(uid)}` : base;
};

export default function App() {
  const [user,          setUser]          = useState(null);
  const [authLoading,   setAuthLoading]   = useState(true);
  const [showAuth,      setShowAuth]      = useState(false);
  const [authMode,      setAuthMode]      = useState('signin');
  const [entered,       setEntered]       = useState(false);
  /* mobile prompt: null = not decided, true = show prompt, false = dismissed (stay) */
  const [mobilePrompt,  setMobilePrompt]  = useState(null);

  /* ── 404 detection ── */
  const rawPath   = window.location.pathname;
  const cleanPath = rawPath === '' ? '/' : rawPath.replace(/\/+$/, '') || '/';
  const is404     = !VALID_PATHS.has(cleanPath);

  const prevAuthRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      const wasAuth = prevAuthRef.current;
      if (u) {
        // Reload to get the latest emailVerified status from Firebase
        try { await u.reload(); } catch {}
      }
      // Only grant access if email is verified
      const isVerified = u && (u.emailVerified || u.providerData?.[0]?.providerId !== 'password');
      const resolvedUser = isVerified ? u : null;
      prevAuthRef.current = !!resolvedUser;
      setUser(resolvedUser);
      setAuthLoading(false);
      if (resolvedUser) setShowAuth(false);
      if (!wasAuth && resolvedUser) {
        setEntered(false);
        setTimeout(() => setEntered(true), 60);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!authLoading) {
      const t = setTimeout(() => setEntered(true), 60);
      return () => clearTimeout(t);
    }
  }, [authLoading]);

  /* ── Mobile detection after auth resolves ── */
  useEffect(() => {
    if (authLoading) return;
    if (is404) return;
    const dismissed = sessionStorage.getItem('sigma_mobile_dismissed');
    if (!dismissed && isMobileDevice()) {
      setMobilePrompt(true);
    }
  }, [authLoading]);

  /* ── 404 ── */
  if (is404) return <NotFound onHome={() => { window.location.href = '/'; }}/>;

  /* ── Loading ── */
  if (authLoading) return <LoadingScreen />;

  /* ── Mobile prompt ── */
  if (mobilePrompt === true) {
    return (
      <MobilePrompt
        mobileUrl={getMobileUrl(user?.uid)}
        onStay={() => {
          sessionStorage.setItem('sigma_mobile_dismissed', '1');
          setMobilePrompt(false);
        }}
      />
    );
  }

  return (
    <>
      <div style={{
        opacity:    entered ? 1 : 0,
        filter:     entered ? 'blur(0px)' : 'blur(16px)',
        transform:  entered ? 'scale(1)' : 'scale(0.98)',
        transition: 'opacity .7s cubic-bezier(.22,1,.36,1), filter .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1)',
      }}>
        <MarketingPage
          user={user}
          onEnter={() => { setAuthMode('signin'); setShowAuth(true); }}
          onLogout={() => setUser(null)}
        />
      </div>

      {showAuth && (
        <AuthModal
          mode={authMode}
          onModeChange={setAuthMode}
          onSuccess={() => setShowAuth(false)}
          onClose={() => setShowAuth(false)}
        />
      )}
    </>
  );
}
