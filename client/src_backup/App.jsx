import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import MarketingPage from './MarketingPage';
import AuthModal from './AuthModal';

export default function App() {
  const [user,        setUser]        = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth,    setShowAuth]    = useState(false);
  const [authMode,    setAuthMode]    = useState('signin');
  const [entered,     setEntered]     = useState(false); // gate for entrance anim

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) setShowAuth(false);
    });
    return unsub;
  }, []);

  /* trigger entrance animation after first paint */
  useEffect(() => {
    if (!authLoading) {
      const t = setTimeout(() => setEntered(true), 60);
      return () => clearTimeout(t);
    }
  }, [authLoading]);

  if (authLoading) {
    return (
      <div style={{
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        height:'100vh', background:'#dceeff', gap:20,
      }}>
        <style>{`
          @keyframes spin { to { transform:rotate(360deg) } }
          @keyframes loader-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.1);opacity:.7} }
        `}</style>
        {/* Slush-style loader */}
        <div style={{
          width:56, height:56, borderRadius:18,
          border:'3px solid #000', background:'#4da2ff',
          display:'flex', alignItems:'center', justifyContent:'center',
          animation:'loader-pulse 1.2s ease-in-out infinite',
          boxShadow:'4px 4px 0 #000',
        }}>
          <span style={{ fontFamily:"'Barlow Condensed',Impact,sans-serif", fontWeight:900, fontSize:28, color:'#000', lineHeight:1 }}>S</span>
        </div>
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase', color:'#000', opacity:.45 }}>Loading…</span>
      </div>
    );
  }

  return (
    <>
      {/* page entrance: fades in from blur over 0.8s */}
      <div style={{
        opacity: entered ? 1 : 0,
        filter:  entered ? 'blur(0px)' : 'blur(20px)',
        transform: entered ? 'scale(1)' : 'scale(0.98)',
        transition: 'opacity .8s cubic-bezier(.22,1,.36,1), filter .8s cubic-bezier(.22,1,.36,1), transform .8s cubic-bezier(.22,1,.36,1)',
      }}>
        <MarketingPage
          user={user}
          onEnter={() => { setAuthMode('signin'); setShowAuth(true); }}
          onLogout={() => setUser(null)}
        />
      </div>

      {/* AuthModal is OUTSIDE the entrance wrapper so it's always visible at full opacity */}
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
