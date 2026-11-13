/**
 * DashboardAnimator.jsx
 * Fires once when isAuth becomes true.
 *
 * NOTE: .sigma-title is a BlurText component rendered as <span> containing
 * <motion.span> children. We do NOT SplitText it again — that breaks the DOM.
 * Instead we animate the sigma-title container as a whole unit, plus
 * the other class-targeted elements that are plain HTML.
 */
import { useEffect, useRef } from 'react';
import { gsap }              from 'gsap';
import { ScrambleTextPlugin }from 'gsap/ScrambleTextPlugin';
import { CustomEase }        from 'gsap/CustomEase';

gsap.registerPlugin(ScrambleTextPlugin, CustomEase);
CustomEase.create('snap4', 'M0,0 C0.16,1.08 0.20,1.00 1,1');

export default function DashboardAnimator({ heroRef, isAuth }) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isAuth) {
      // Reset so it can run again next login
      hasRun.current = false;
      return;
    }
    if (hasRun.current || !heroRef?.current) return;
    hasRun.current = true;

    const hero = heroRef.current;

    // Small delay so BlurText has mounted and started its own animation
    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {

        /* ── 1. Full-screen scan flash ── */
        const scan = document.createElement('div');
        scan.style.cssText = `
          position:absolute;inset:0;z-index:20;pointer-events:none;
          background:linear-gradient(to bottom,
            transparent 0%,
            rgba(85,219,156,0.06) 40%,
            rgba(85,219,156,0.14) 50%,
            rgba(85,219,156,0.06) 60%,
            transparent 100%);
        `;
        hero.appendChild(scan);
        gsap.fromTo(scan,
          { y: '-100%', opacity: 0 },
          { y: '110%', opacity: 1, duration: 0.65, ease: 'none',
            onComplete: () => { if (hero.contains(scan)) hero.removeChild(scan); }
          }
        );

        /* ── 2. SIGMAVISION container: scale + fade punch ──
           BlurText is already animating the letters — we layer on top
           a quick scale punch on the whole container once BlurText settles */
        const sigmaEl = hero.querySelector('.sigma-title');
        if (sigmaEl) {
          gsap.fromTo(sigmaEl,
            { scale: 0.88, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.7, ease: 'snap4', delay: 0.1 }
          );
          // After entry — continuous subtle float on the container
          gsap.to(sigmaEl, {
            y: -10,
            duration: 3.8,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: 0.9,
          });
        }

        /* ── 3. "Dashboard live" label scramble ── */
        const label = hero.querySelector('.dash-label');
        if (label) {
          gsap.set(label, { opacity: 0 });
          gsap.to(label, { opacity: 1, duration: 0, delay: 0.5 });
          gsap.to(label, {
            delay: 0.5,
            duration: 1.0,
            scrambleText: {
              text: 'Dashboard live',
              chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
              speed: 0.6,
              revealDelay: 0.1,
            },
          });
        }

        /* ── 4. StatusPills slam up ── */
        const pills = hero.querySelectorAll('.status-pill-wrap');
        if (pills.length) {
          gsap.from(pills, {
            y: 44, opacity: 0, scale: 0.8,
            stagger: 0.1,
            duration: 0.55,
            ease: 'snap4',
            delay: 0.7,
          });
        }

        /* ── 5. Action buttons bounce in ── */
        const btns = hero.querySelectorAll('.dash-action-btn');
        if (btns.length) {
          gsap.from(btns, {
            scale: 0, opacity: 0,
            stagger: 0.11,
            duration: 0.5,
            ease: 'back.out(1.6)',
            delay: 1.0,
          });
        }

        /* ── 6. Monitor glow pulse ── */
        const monWrap = hero.querySelector('.mon-glow');
        if (monWrap) {
          gsap.fromTo(monWrap,
            { filter: 'drop-shadow(0 0 0px rgba(85,219,156,0))' },
            {
              filter: 'drop-shadow(0 0 32px rgba(85,219,156,0.5))',
              duration: 0.55, ease: 'power2.out', delay: 1.3,
              yoyo: true, repeat: 1,
              onComplete: () => gsap.set(monWrap, { clearProps: 'filter' }),
            }
          );
        }

      }, hero);

      return () => ctx.revert();
    }, 80); // 80ms — enough for DOM to settle after isAuth flip

    return () => clearTimeout(timer);
  }, [isAuth]);

  return null;
}
