/**
 * LoadingScreen.jsx — SigmaVision custom loading screen
 * Pure CSS animations — no GSAP dependency so it can't crash.
 */
export default function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#dceeff',
      gap: 20,
      userSelect: 'none',
    }}>
      <style>{`
        @keyframes ls-pulse {
          0%,100% { transform:scale(1); box-shadow:4px 5px 0 #000; }
          50%      { transform:scale(1.06); box-shadow:5px 6px 0 #000; }
        }
        @keyframes ls-scan {
          0%   { transform:translateY(-100%); opacity:0; }
          20%  { opacity:1; }
          80%  { opacity:1; }
          100% { transform:translateY(200%); opacity:0; }
        }
        @keyframes ls-dot1 { 0%,66%,100%{opacity:.15} 10%,56%{opacity:1} }
        @keyframes ls-dot2 { 0%,33%,66%,100%{opacity:.15} 40%,76%{opacity:1} }
        @keyframes ls-dot3 { 0%,50%,100%{opacity:.15} 60%,96%{opacity:1} }
      `}</style>

      {/* S logo with scan animation */}
      <div style={{
        width: 64, height: 64,
        borderRadius: 16,
        border: '2.5px solid #000',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '4px 5px 0 #000',
        position: 'relative',
        overflow: 'hidden',
        animation: 'ls-pulse 1.8s ease-in-out infinite',
      }}>
        {/* scan line */}
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          height: '40%',
          background: 'linear-gradient(to bottom, transparent, rgba(77,162,255,0.35), transparent)',
          animation: 'ls-scan 1.6s ease-in-out infinite',
          pointerEvents: 'none',
        }}/>
        <span style={{
          fontFamily: "'Barlow Condensed','Bebas Neue',Impact,sans-serif",
          fontWeight: 900,
          fontSize: 34,
          color: '#000',
          lineHeight: 1,
          position: 'relative',
          zIndex: 1,
        }}>S</span>
      </div>

      {/* label + dots */}
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: '#000',
        opacity: .4,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        SigmaVision
        <span style={{ display:'flex', gap: 4, marginLeft: 4 }}>
          <span style={{ width:4, height:4, borderRadius:'50%', background:'#000', display:'inline-block', animation:'ls-dot1 1.2s ease-in-out infinite' }}/>
          <span style={{ width:4, height:4, borderRadius:'50%', background:'#000', display:'inline-block', animation:'ls-dot2 1.2s ease-in-out infinite' }}/>
          <span style={{ width:4, height:4, borderRadius:'50%', background:'#000', display:'inline-block', animation:'ls-dot3 1.2s ease-in-out infinite' }}/>
        </span>
      </div>
    </div>
  );
}
