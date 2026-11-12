/**
 * MonitorSplash.jsx
 *
 * Vector animation that plays on the dark monitor screen
 * after the monitor finishes rising into position (non-auth view).
 *
 * Sequence (all GSAP, DrawSVG + MorphSVG + ScrambleText):
 *  0.0s — scan line sweeps across screen (CRT boot feel)
 *  0.4s — S.I.G.M.A logo draws in with DrawSVG
 *  1.0s — four status rows scramble in one by one
 *  2.0s — camera icon + GPS dot pulse
 *  loop — subtle cursor blink on last line
 */
import { useEffect, useRef } from 'react';
import { gsap }              from 'gsap';
import { DrawSVGPlugin }     from 'gsap/DrawSVGPlugin';
import { ScrambleTextPlugin }from 'gsap/ScrambleTextPlugin';

gsap.registerPlugin(DrawSVGPlugin, ScrambleTextPlugin);

/* slush accent colors */
const MINT  = '#55db9c';
const BLUE  = '#4da2ff';
const EMBER = '#fb4903';
const SUN   = '#ffd731';

export default function MonitorSplash() {
  const rootRef   = useRef(null);
  const scanRef   = useRef(null);
  const svgRef    = useRef(null);
  const row1Ref   = useRef(null);
  const row2Ref   = useRef(null);
  const row3Ref   = useRef(null);
  const row4Ref   = useRef(null);
  const cursorRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {

      /* ── 1. CRT scan line sweep ── */
      gsap.fromTo(scanRef.current,
        { y: '-100%' },
        { y: '100%', duration: 0.55, ease: 'none',
          onComplete: () => {
            /* hide after sweep */
            gsap.set(scanRef.current, { opacity: 0 });
          }
        }
      );

      /* ── 2. DrawSVG: S.I.G.M.A logo paths ── */
      const drawPaths = svgRef.current?.querySelectorAll('[data-d]');
      if (drawPaths?.length) {
        gsap.set(drawPaths, { drawSVG: '0%' });
        gsap.to(drawPaths, {
          drawSVG: '100%',
          stagger: 0.1,
          duration: 0.9,
          ease: 'power2.out',
          delay: 0.5,
        });
      }

      /* ── 3. Status rows scramble in ── */
      const rows = [
        { ref: row1Ref, text: '> SYSTEM BOOT OK', color: MINT,  delay: 1.1 },
        { ref: row2Ref, text: '> CAMERA OFFLINE', color: EMBER, delay: 1.5 },
        { ref: row3Ref, text: '> GPS SEARCHING…', color: SUN,   delay: 1.9 },
        { ref: row4Ref, text: '> AWAITING USER', color: BLUE,   delay: 2.3 },
      ];

      rows.forEach(({ ref, text, color, delay }) => {
        if (!ref.current) return;
        gsap.set(ref.current, { opacity: 0 });
        gsap.to(ref.current, { opacity: 1, duration: 0, delay });
        gsap.to(ref.current, {
          delay,
          duration: 0.9,
          scrambleText: {
            text,
            chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789>_',
            speed: 0.6,
            revealDelay: 0.1,
          },
          color,
        });
      });

      /* ── 4. Cursor blink after last row ── */
      gsap.to(cursorRef.current, {
        opacity: 0,
        duration: 0.5,
        ease: 'steps(1)',
        repeat: -1,
        yoyo: true,
        delay: 3.4,
      });

    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} style={{
      position: 'absolute',
      inset: 0,
      background: '#0a0a0a',
      borderRadius: 2,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0,
      padding: '8% 10%',
    }}>

      {/* CRT scan line */}
      <div ref={scanRef} style={{
        position: 'absolute',
        left: 0, right: 0,
        height: '30%',
        background: 'linear-gradient(to bottom, transparent, rgba(77,162,255,0.08), transparent)',
        pointerEvents: 'none',
        zIndex: 10,
      }}/>

      {/* S.I.G.M.A logo SVG — DrawSVG */}
      <svg ref={svgRef} viewBox="0 0 120 36" fill="none"
        style={{ width: '70%', maxWidth: 180, marginBottom: '8%', overflow: 'visible' }}>
        {/* S */}
        <path data-d
          d="M4 10 C4 7 6 5 10 5 L18 5 C22 5 24 7 24 10 C24 13 22 15 18 16 L10 17 C6 18 4 20 4 23 C4 26 6 28 10 28 L18 28 C22 28 24 26 24 23"
          stroke={MINT} strokeWidth="2.8" strokeLinecap="round" fill="none"/>
        {/* . */}
        <circle data-d cx="30" cy="27" r="1.8" fill={MINT}/>
        {/* I */}
        <line data-d x1="36" y1="5" x2="36" y2="28" stroke={BLUE} strokeWidth="2.8" strokeLinecap="round"/>
        {/* . */}
        <circle data-d cx="42" cy="27" r="1.8" fill={BLUE}/>
        {/* G */}
        <path data-d
          d="M64 10 C60 6 48 6 48 16 C48 26 60 28 68 24 L68 18 L60 18"
          stroke={SUN} strokeWidth="2.8" strokeLinecap="round" fill="none"/>
        {/* . */}
        <circle data-d cx="74" cy="27" r="1.8" fill={SUN}/>
        {/* M */}
        <path data-d
          d="M80 28 L80 5 L88 18 L96 5 L96 28"
          stroke={EMBER} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        {/* . */}
        <circle data-d cx="102" cy="27" r="1.8" fill={EMBER}/>
        {/* A */}
        <path data-d
          d="M108 28 L115 5 L122 28 M110 20 L120 20"
          stroke="#f5f0e8" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>

      {/* status rows */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '6%',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 'clamp(5px,0.9vw,10px)',
        fontWeight: 700,
        letterSpacing: '0.08em',
      }}>
        <div ref={row1Ref} style={{ color: MINT,  opacity: 0 }}>{'> SYSTEM BOOT OK'}</div>
        <div ref={row2Ref} style={{ color: EMBER, opacity: 0 }}>{'> CAMERA OFFLINE'}</div>
        <div ref={row3Ref} style={{ color: SUN,   opacity: 0 }}>{'> GPS SEARCHING…'}</div>
        <div ref={row4Ref} style={{ color: BLUE,  opacity: 0, display:'flex', alignItems:'center', gap: 4 }}>
          {'> AWAITING USER'}
          <span ref={cursorRef} style={{
            display: 'inline-block',
            width: '0.6em', height: '1em',
            background: BLUE,
            verticalAlign: 'middle',
            marginLeft: 2,
          }}/>
        </div>
      </div>

      {/* corner version tag */}
      <div style={{
        position: 'absolute',
        bottom: '4%',
        right: '5%',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 'clamp(4px,0.7vw,8px)',
        color: '#fff',
        opacity: .18,
        letterSpacing: '0.1em',
      }}>v1.0</div>
    </div>
  );
}
