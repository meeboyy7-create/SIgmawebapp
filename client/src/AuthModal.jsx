import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';

/* ── Slush tokens (mirrors MarketingPage) ── */
const S = {
  carbon:'#000000', paper:'#ffffff', sky:'#dceeff',
  blue:'#4da2ff', mint:'#55db9c', lavender:'#e9ccff',
  ember:'#fb4903', sun:'#ffd731', violet:'#5c4ade',
  fD:"'Barlow Condensed','Bebas Neue',Impact,sans-serif",
  fU:"'DM Sans',ui-sans-serif,sans-serif",
  fM:"'IBM Plex Mono',ui-monospace,monospace",
};

function friendlyError(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Wrong email or password.';
    case 'auth/email-already-in-use': return 'That email is already registered.';
    case 'auth/weak-password': return 'Password needs at least 6 characters.';
    case 'auth/invalid-email': return 'Enter a valid email address.';
    case 'auth/too-many-requests': return 'Too many attempts — try again later.';
    default: return 'Something went wrong. Please try again.';
  }
}

/* ── Shared input ── */
function Field({ label, type, value, onChange, placeholder, autoComplete }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{
        display:'block', fontFamily:S.fM, fontSize:10,
        fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase',
        color:S.carbon, opacity:.5, marginBottom:8,
      }}>{label}</label>
      <input
        type={type} required autoComplete={autoComplete}
        value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={()=>setFocused(true)}
        onBlur={()=>setFocused(false)}
        style={{
          width:'100%', padding:'13px 16px', borderRadius:6,
          border:`2px solid ${focused?S.carbon:'rgba(0,0,0,0.15)'}`,
          background:focused?S.paper:S.sky,
          fontFamily:S.fU, fontSize:15, color:S.carbon,
          boxSizing:'border-box',
          transition:'border-color .15s, background .15s',
        }}
      />
    </div>
  );
}

/* ── Error pill ── */
function ErrorPill({ msg }) {
  return (
    <div style={{
      background:S.ember, border:`2px solid ${S.carbon}`,
      borderRadius:12, padding:'10px 14px',
      fontFamily:S.fU, fontSize:13, fontWeight:700,
      color:S.paper, letterSpacing:'-0.01em',
    }}>{msg}</div>
  );
}

/* ── Close button ── */
function CloseBtn({ onClose }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClose} aria-label="Close"
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        width:36, height:36, borderRadius:9999, flexShrink:0,
        border:`2px solid ${S.carbon}`,
        background:hov?S.carbon:S.paper,
        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
        transition:'background .15s',
      }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke={hov?S.paper:S.carbon} strokeWidth="2.5" strokeLinecap="round">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  );
}

/* ── Spinner ── */
function Spinner() {
  return (
    <span style={{
      width:16, height:16, border:`2.5px solid rgba(255,255,255,0.35)`,
      borderTop:`2.5px solid #fff`, borderRadius:'50%',
      display:'inline-block', animation:'auth-spin .7s linear infinite',
    }}/>
  );
}

/* ════════════════════════════════════════════
   MAIN EXPORT
════════════════════════════════════════════ */
export default function AuthModal({ mode, onModeChange, onSuccess, onClose }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [sent,     setSent]     = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    setEmail(''); setPassword(''); setError(''); setSent(false);
  }, [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
        onSuccess();
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(cred.user);
        await signOut(auth);
        setSent(true);
      }
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  /* pick accent color per mode */
  const accent = mode === 'signin' ? S.blue : S.mint;

  return (
    <>
      <style>{`
        @keyframes auth-spin { to{transform:rotate(360deg)} }
        @keyframes auth-bd   { from{opacity:0} to{opacity:1} }
        @keyframes auth-card-spring {
          0%   { opacity:0; transform:translate(-50%,-44%) scale(0.82); filter:blur(8px); }
          60%  { opacity:1; transform:translate(-50%,-51%) scale(1.04); filter:blur(0px); }
          78%  { transform:translate(-50%,-49%) scale(0.98); }
          90%  { transform:translate(-50%,-50.5%) scale(1.01); }
          100% { transform:translate(-50%,-50%) scale(1); }
        }
      `}</style>

      {/* backdrop */}
      <div onClick={onClose} style={{
        position:'fixed', inset:0, zIndex:200,
        background:'rgba(0,0,0,0.55)',
        animation:'auth-bd .22s ease both',
      }}/>

      {/* card — spring pop with slight overshoot */}
      <div style={{
        position:'fixed', top:'50%', left:'50%',
        transform:'translate(-50%,-50%)',
        zIndex:201, width:'min(94vw,440px)',
        animation:'auth-card-spring .55s cubic-bezier(.22,1,.36,1) both',
      }}>
        {sent ? (
          <VerifyView email={email} onClose={onClose} onSignIn={()=>onModeChange('signin')} accent={accent}/>
        ) : (
          <div style={{
            background:S.paper,
            border:`2.5px solid ${S.carbon}`,
            borderRadius:12,
            overflow:'hidden',
            boxShadow:`8px 12px 0px ${S.carbon}`,
          }}>
            {/* colored top band */}
            <div style={{
              background:accent,
              borderBottom:`2.5px solid ${S.carbon}`,
              padding:'22px 28px 18px',
              display:'flex', alignItems:'flex-start', justifyContent:'space-between',
            }}>
              <div>
                <div style={{
                  fontFamily:S.fD, fontWeight:900,
                  fontSize:'clamp(42px,8vw,64px)',
                  lineHeight:.85, textTransform:'uppercase',
                  color:S.carbon, letterSpacing:'-0.01em',
                }}>
                  {mode==='signin'?'SIGN\nIN':'JOIN\nUS'}
                </div>
                <p style={{
                  fontFamily:S.fU, fontSize:13, fontWeight:500,
                  color:S.carbon, opacity:.65, margin:'8px 0 0',
                  letterSpacing:'-0.01em',
                }}>
                  {mode==='signin'
                    ? 'Access your SigmaVision dashboard.'
                    : 'A verification link will be sent to your email.'}
                </p>
              </div>
              <CloseBtn onClose={onClose}/>
            </div>

            {/* form body */}
            <div style={{padding:'24px 28px 28px'}}>
              <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>
                <Field label="Email"    type="email"    value={email}    onChange={setEmail}
                  placeholder="you@example.com" autoComplete="email"/>
                <Field label="Password" type="password" value={password} onChange={setPassword}
                  placeholder={mode==='signin'?'Your password':'Min. 6 characters'}
                  autoComplete={mode==='signin'?'current-password':'new-password'}/>

                {error && <ErrorPill msg={error}/>}

                {/* submit CTA */}
                <button type="submit" disabled={loading} style={{
                  width:'100%', padding:'15px 0', borderRadius:9999,
                  border:`2px solid ${S.carbon}`,
                  background:S.carbon, color:S.paper,
                  fontFamily:S.fU, fontWeight:700, fontSize:15,
                  letterSpacing:'0.02em', cursor:loading?'not-allowed':'pointer',
                  opacity:loading?.7:1,
                  display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                  transition:'opacity .15s, transform .15s',
                  boxShadow:`3px 3px 0px ${accent}`,
                }}
                  onMouseEnter={e=>{if(!loading){e.currentTarget.style.opacity='.85';}}}
                  onMouseLeave={e=>{e.currentTarget.style.opacity='1';}}
                  onMouseDown={e=>{if(!loading)e.currentTarget.style.transform='scale(0.97)';}}
                  onMouseUp={e=>{e.currentTarget.style.transform='scale(1)';}}
                >
                  {loading && <Spinner/>}
                  {loading
                    ? (mode==='signin'?'Signing in…':'Creating account…')
                    : (mode==='signin'?'Launch App':'Create Account')}
                </button>

                {/* mode switch */}
                <p style={{
                  textAlign:'center', fontFamily:S.fU,
                  fontSize:13, color:S.carbon, opacity:.55, margin:0,
                }}>
                  {mode==='signin'?'No account? ':'Already have one? '}
                  <button type="button" onClick={()=>onModeChange(mode==='signin'?'signup':'signin')}
                    style={{
                      background:'none', border:'none', cursor:'pointer',
                      fontFamily:S.fU, fontWeight:700, fontSize:13,
                      color:S.carbon, padding:0, textDecoration:'underline',
                      textUnderlineOffset:3,
                    }}>
                    {mode==='signin'?'Sign up':'Sign in'}
                  </button>
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Email sent view ── */
function VerifyView({ email, onClose, onSignIn, accent }) {
  return (
    <div style={{
      background:S.paper,
      border:`2.5px solid ${S.carbon}`,
      borderRadius:12,
      overflow:'hidden',
      boxShadow:`8px 12px 0px ${S.carbon}`,
    }}>
      {/* top band */}
      <div style={{
        background:S.sun,
        borderBottom:`2.5px solid ${S.carbon}`,
        padding:'22px 28px 18px',
        display:'flex', alignItems:'flex-start', justifyContent:'space-between',
      }}>
        <div style={{
          fontFamily:S.fD, fontWeight:900,
          fontSize:'clamp(42px,8vw,64px)',
          lineHeight:.85, textTransform:'uppercase',
          color:S.carbon,
        }}>CHECK<br/>INBOX</div>
        <CloseBtn onClose={onClose}/>
      </div>
      <div style={{padding:'28px',textAlign:'center'}}>
        {/* envelope icon */}
        <div style={{
          width:72, height:72, borderRadius:20,
          background:S.sky, border:`2px solid ${S.carbon}`,
          margin:'0 auto 20px',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke={S.carbon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <p style={{fontFamily:S.fU,fontSize:14,fontWeight:500,lineHeight:1.7,color:S.carbon,opacity:.7,marginBottom:24}}>
          We sent a link to<br/>
          <strong style={{color:S.carbon,opacity:1}}>{email}</strong>.<br/>
          Click it to verify your account.
        </p>
        <button onClick={onSignIn} style={{
          width:'100%', padding:'14px 0', borderRadius:9999,
          border:`2px solid ${S.carbon}`,
          background:S.carbon, color:S.paper,
          fontFamily:S.fU, fontWeight:700, fontSize:14,
          cursor:'pointer', marginBottom:12,
          boxShadow:`3px 3px 0px ${S.sun}`,
        }}>Go to Sign In</button>
        <button onClick={onClose} style={{
          background:'none', border:'none', cursor:'pointer',
          fontFamily:S.fU, fontSize:13, color:S.carbon, opacity:.4,
        }}>Dismiss</button>
      </div>
    </div>
  );
}
