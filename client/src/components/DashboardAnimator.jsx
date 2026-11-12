/**
 * DashboardAnimator.jsx
 *
 * Runs once when the user logs in.
 * Targets elements already in the DOM via class selectors.
 *
 * Sequence:
 *  0.0s  — hero section flashes a scan-line sweep (CRT power-on)
 *  0.2s  — SIGMAVISION letters scatter then reassemble
 *  0.6s  — "Dashboard live" label scrambles in
 *  0.8s  — StatusPills slam up from below, staggered
 *  1.1s  — Action buttons pop in from scale 0, staggered
 *  1.4s  — monitor does a subtle pulse glow
 */
import { useEffect, useRef } from 'react';
import { gsap }              from 'gsap';
import { SplitText }         from 'gsap/SplitText';
import { ScrambleTextPlugin }from 'gsap/ScrambleTextPlugin';
import { CustomEase }        from 'gsap/CustomEase';

gsap.registerPlugin(SplitText, ScrambleTextPlugin, CustomEase);
CustomEase.create('snap4', 'M0,0 C0.16,1.08 0.20,1.00 1,1');

export default function DashboardAnimator({ heroRef, isAuth }) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isAuth || hasRun.current || !heroRef?.current) return;
    hasRun.current = true;

    const hero = heroRef.current;
    const ctx  = gsap.context(() => {

      /* ── 1. Full-screen scan flash ── */
      const scan = document.createElement('div');
      scan.style.cssText = `
        position:absolute; inset:0; z-index:20; pointer-events:none;
        background: linear-gradient(to bottom,
          transparent 0%,
          rgba(85,219,156,0.06) 40%,
          rgba(85,219,156,0.14) 50%,
          rgba(85,219,156,0.06) 60%,
          transparent 100%);
      `;
      hero.appendChild(scan);

      gsap.fromTo(scan,
        { y: '-100%', opacity: 0 },
        {
          y: '110%', opacity: 1, duration: 0.7, ease: 'none',
          onComplete: () => hero.removeChild(scan),
        }
      );

      /* ── 2. SIGMAVISION letter scatter → reassemble ── */
      const sigmaEl = hero.querySelector('.sigma-title');
      if (sigmaEl) {
        const sp = new SplitText(sigmaEl, { type: 'chars' });
        gsap.set(sp.chars, {
          x:        () => gsap.utils.random(-120, 120),
          y:        () => gsap.utils.random(-80, 80),
          rotation: () => gsap.utils.random(-25, 25),
          opacity: 0,
          scale:    () => gsap.utils.random(0.4, 1.6),
        });
        gsap.to(sp.chars, {
          x: 0, y: 0, rotation: 0, opacity: 1, scale: 1,
          stagger: { amount: 0.5, from: 'center' },
          ease: 'snap4',
          duration: 0.9,
          delay: 0.15,
          onComplete: () => {
            sp.revert();
            /* after reassembly — continuous subtle shimmer on SIGMAVISION */
            const letters = sigmaEl.querySelectorAll('.char') || [];
            if (!letters.length) {
              /* fallback: just float the whole element */
              gsap.to(sigmaEl, {
                y: -8, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1,
              });
            }
          },
        });
      }

      /* ── 3. "Dashboard live" label scramble ── */
      const label = hero.querySelector('.dash-label');
      if (label) {
        gsap.set(label, { opacity: 0 });
        gsap.to(label, { opacity: 1, duration: 0, delay: 0.55 });
        gsap.to(label, {
          delay: 0.55,
          duration: 0.9,
          scrambleText: {
            text: 'Dashboard live',
            chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            speed: 0.7,
            revealDelay: 0.1,
          },
        });
      }

      /* ── 4. StatusPills slam up ── */
      const pills = hero.querySelectorAll('.status-pill-wrap');
      if (pills.length) {
        gsap.from(pills, {
          y: 40, opacity: 0, scale: 0.8,
          stagger: 0.1,
          duration: 0.5,
          ease: 'snap4',
          delay: 0.75,
        });
      }

      /* ── 5. Action buttons bounce in ── */
      const btns = hero.querySelectorAll('.dash-action-btn');
      if (btns.length) {
        gsap.from(btns, {
          scale: 0, opacity: 0,
          stagger: 0.12,
          duration: 0.5,
          ease: 'back.out(1.6)',
          delay: 1.05,
        });
      }

      /* ── 6. Monitor subtle glow pulse ── */
      const monWrap = hero.querySelector('.mon-glow');
      if (monWrap) {
        gsap.fromTo(monWrap,
          { filter: 'drop-shadow(0 0 0px rgba(85,219,156,0))' },
          {
            filter: 'drop-shadow(0 0 32px rgba(85,219,156,0.45))',
            duration: 0.6, ease: 'power2.out', delay: 1.3,
            yoyo: true, repeat: 1,
            onComplete: () => gsap.set(monWrap, { filter: 'none' }),
          }
        );
      }

    }, hero);

    return () => ctx.revert();
  }, [isAuth]);

  return null;
}
