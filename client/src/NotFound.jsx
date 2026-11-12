/**
 * NotFound.jsx — SigmaVision 404 page
 * Slush theme: sky background, carbon text, offset shadows.
 * Uses GSAP DrawSVG to draw a broken-signal SVG on mount.
 */
import { useEffect, useRef } from 'react';
import { gsap }             from 'gsap';
import { DrawSVGPlugin }    from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(DrawSVGPlugin);

export default function NotFound({ onHome }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const paths = svgRef.current.querySelectorAll('[data-draw]');
    gsap.set(paths, { drawSVG: '0%' });
    gsap.to(paths, {
      drawSVG: '100%',
      duration: 1.4,
      stagger: 0.12,
      ease: 'power2.out',
      delay: 0.3,
    });
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#dceeff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', ui-sans-serif, sans-serif",
      padding: 'clamp(32px,6vw,80px)',
      textAlign: 'center',
      gap: 0,
    }}>

      {/* SVG illustration — broken monitor signal */}
      <svg ref={svgRef} viewBox="0 0 240 180" fill="none"
        style={{ width: 'clamp(160px,22vw,280px)', marginBottom: 32, overflow: 'visible' }}>

        {/* monitor shell */}
        <rect data-draw x="20" y="20" width="200" height="120" rx="10"
          stroke="#000" strokeWidth="3.5" fill="none"/>
        {/* screen inset */}
        <rect data-draw x="32" y="30" width="176" height="96" rx="4"
          stroke="#000" strokeWidth="2" fill="rgba(0,0,0,0.04)"/>

        {/* broken signal — 4 vertical bars, last two cut */}
        <rect data-draw x="72"  y="84" width="10" height="28" rx="2" stroke="#000" strokeWidth="2.5" fill="none"/>
        <rect data-draw x="90"  y="72" width="10" height="40" rx="2" stroke="#000" strokeWidth="2.5" fill="none"/>
        <rect data-draw x="108" y="60" width="10" height="52" rx="2" stroke="#000" strokeWidth="2.5" fill="none" opacity=".25"/>
        <rect data-draw x="126" y="48" width="10" height="64" rx="2" stroke="#000" strokeWidth="2.5" fill="none" opacity=".25"/>

        {/* X across the two dim bars */}
        <line data-draw x1="106" y1="58" x2="118" y2="74" stroke="#fb4903" strokeWidth="3" strokeLinecap="round"/>
        <line data-draw x1="118" y1="58" x2="106" y2="74" stroke="#fb4903" strokeWidth="3" strokeLinecap="round"/>

        {/* stand */}
        <line data-draw x1="120" y1="140" x2="120" y2="160" stroke="#000" strokeWidth="4" strokeLinecap="round"/>
        <line data-draw x1="88"  y1="160" x2="152" y2="160" stroke="#000" strokeWidth="4" strokeLinecap="round"/>

        {/* 404 text inside screen */}
        <text x="162" y="88" textAnchor="middle"
          fontFamily="'Barlow Condensed','Bebas Neue',Impact,sans-serif"
          fontWeight="900" fontSize="32" fill="#000" letterSpacing="-1">404</text>
      </svg>

      {/* mono eyebrow */}
      <p style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10, fontWeight: 700,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: '#000', opacity: .35,
        margin: '0 0 14px',
      }}>Page not found</p>

      {/* headline */}
      <h1 style={{
        fontFamily: "'Barlow Condensed','Bebas Neue',Impact,sans-serif",
        fontWeight: 900,
        fontSize: 'clamp(52px,8vw,96px)',
        lineHeight: .86,
        textTransform: 'uppercase',
        color: '#000',
        margin: '0 0 20px',
        letterSpacing: '-0.01em',
      }}>
        NOTHING<br/>HERE.
      </h1>

      {/* body */}
      <p style={{
        fontFamily: "'DM Sans', ui-sans-serif, sans-serif",
        fontSize: 'clamp(14px,1.4vw,17px)',
        fontWeight: 500,
        lineHeight: 1.65,
        color: '#000',
        opacity: .55,
        maxWidth: 380,
        margin: '0 0 36px',
      }}>
        That URL doesn't exist. The dashboard is at the root — head back and try again.
      </p>

      {/* CTA */}
      <button
        onClick={onHome || (() => { window.location.href = '/'; })}
        onMouseEnter={e => e.currentTarget.style.opacity = '.75'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        style={{
          fontFamily: "'DM Sans', ui-sans-serif, sans-serif",
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: '0.032em',
          textTransform: 'uppercase',
          color: '#fff',
          background: '#000',
          border: '2px solid #000',
          borderRadius: 9999,
          padding: '14px 36px',
          cursor: 'pointer',
          transition: 'opacity .18s',
          boxShadow: '4px 4px 0 #4da2ff',
        }}>
        Back to Dashboard
      </button>

      {/* footer note */}
      <p style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        color: '#000',
        opacity: .22,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginTop: 48,
      }}>
        SigmaVision · NCSHS
      </p>
    </div>
  );
}
