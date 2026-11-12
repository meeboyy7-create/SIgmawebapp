/**
 * MobilePrompt.jsx
 * Shown when a phone/tablet opens the full PC webapp.
 * Two choices: go to the mobile GPS tracker, or stay on the full dashboard.
 */
export default function MobilePrompt({ onStay, mobileUrl }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#dceeff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      fontFamily: "'DM Sans', ui-sans-serif, sans-serif",
      textAlign: 'center',
      gap: 0,
    }}>

      {/* logo */}
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        border: '2.5px solid #000', background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '4px 5px 0 #000', marginBottom: 24,
      }}>
        <span style={{ fontFamily:"'Barlow Condensed',Impact,sans-serif", fontWeight:900, fontSize:30, color:'#000', lineHeight:1 }}>S</span>
      </div>

      {/* eyebrow */}
      <p style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10, fontWeight: 700,
        letterSpacing: '0.2em', textTransform: 'uppercase',
        color: '#000', opacity: .35,
        marginBottom: 12,
      }}>SigmaVision — Mobile detected</p>

      {/* headline */}
      <h1 style={{
        fontFamily: "'Barlow Condensed','Bebas Neue',Impact,sans-serif",
        fontWeight: 900, fontSize: 'clamp(40px,10vw,64px)',
        lineHeight: .88, textTransform: 'uppercase',
        color: '#000', marginBottom: 16, letterSpacing: '-0.01em',
      }}>
        WHICH<br/>VERSION?
      </h1>

      {/* body */}
      <p style={{
        fontSize: 15, fontWeight: 500, lineHeight: 1.65,
        color: '#000', opacity: .55, maxWidth: 320,
        marginBottom: 32,
      }}>
        You're on a phone. The GPS tracker is built for mobile. The full dashboard is designed for a larger screen.
      </p>

      {/* option cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340 }}>

        {/* Mobile GPS option — primary */}
        <a href={mobileUrl}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: '#000', color: '#fff',
            border: '2px solid #000', borderRadius: 14,
            padding: '16px 20px', textDecoration: 'none',
            boxShadow: '4px 4px 0 #55db9c',
            transition: 'opacity .15s',
          }}
          onMouseEnter={e=>e.currentTarget.style.opacity='.85'}
          onMouseLeave={e=>e.currentTarget.style.opacity='1'}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: '#55db9c',
            border: '2px solid #55db9c', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:15, letterSpacing:'-0.01em' }}>GPS Tracker</div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, opacity:.6, letterSpacing:'0.1em', textTransform:'uppercase', marginTop:2 }}>Recommended for mobile</div>
          </div>
        </a>

        {/* Full dashboard — secondary */}
        <button onClick={onStay}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: '#fff', color: '#000',
            border: '2px solid #000', borderRadius: 14,
            padding: '16px 20px', cursor: 'pointer',
            boxShadow: '4px 4px 0 #000',
            transition: 'opacity .15s', width: '100%',
          }}
          onMouseEnter={e=>e.currentTarget.style.opacity='.8'}
          onMouseLeave={e=>e.currentTarget.style.opacity='1'}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: '#dceeff',
            border: '2px solid #000', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:15, letterSpacing:'-0.01em' }}>Full Dashboard</div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, opacity:.5, letterSpacing:'0.1em', textTransform:'uppercase', marginTop:2 }}>Better on desktop</div>
          </div>
        </button>

      </div>

      {/* fine print */}
      <p style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9, color: '#000', opacity: .2,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        marginTop: 32,
      }}>SigmaVision · NCSHS</p>
    </div>
  );
}
