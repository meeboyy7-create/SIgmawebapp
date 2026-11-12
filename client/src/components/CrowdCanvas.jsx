/**
 * CrowdCanvas.jsx
 *
 * Direct port of the Open Peeps crowd canvas animation.
 * Original: https://codepen.io/zadvorsky/pen/xxwbBQV
 * Illustration: openpeeps.com (CC0)
 * Adapted from Skiper UI CrowdCanvas (TypeScript → JSX).
 *
 * Uses the real open-peeps-sheet.png sprite (rows=15, cols=7)
 * served from /open-peeps-sheet.png in public/.
 */
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function CrowdCanvas({ src = '/open-peeps-sheet.png', rows = 15, cols = 7 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    /* ── UTILS ── */
    const randomRange    = (min, max) => min + Math.random() * (max - min);
    const randomIndex    = (arr) => (randomRange(0, arr.length) | 0);
    const removeFrom     = (arr, i) => arr.splice(i, 1)[0];
    const removeItem     = (arr, item) => removeFrom(arr, arr.indexOf(item));
    const removeRandom   = (arr) => removeFrom(arr, randomIndex(arr));
    const getRandom      = (arr) => arr[randomIndex(arr) | 0];

    /* ── STAGE ── */
    const stage = { width: 0, height: 0 };

    /* ── PEEP FACTORY ── */
    const createPeep = ({ image, rect }) => {
      const peep = {
        image,
        rect: [],
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        anchorY: 0,
        scaleX: 1,
        walk: null,

        setRect(r) {
          this.rect   = r;
          this.width  = r[2];
          this.height = r[3];
        },

        render(c) {
          c.save();
          c.translate(this.x, this.y);
          c.scale(this.scaleX, 1);
          c.drawImage(
            this.image,
            this.rect[0], this.rect[1], this.rect[2], this.rect[3],
            0, 0, this.width, this.height
          );
          c.restore();
        },
      };
      peep.setRect(rect);
      return peep;
    };

    /* ── WALK TWEEN ── */
    const normalWalk = ({ peep, props }) => {
      const { startY, endX } = props;
      const xDuration = 10;
      const yDuration = 0.25;
      const tl = gsap.timeline();
      tl.timeScale(randomRange(0.5, 1.5));
      tl.to(peep, { duration: xDuration, x: endX, ease: 'none' }, 0);
      tl.to(peep, { duration: yDuration, repeat: xDuration / yDuration, yoyo: true, y: startY - 10 }, 0);
      return tl;
    };
    const walks = [normalWalk];

    /* ── RESET PEEP POSITION ── */
    const resetPeep = ({ peep }) => {
      const direction = Math.random() > 0.5 ? 1 : -1;
      /* offsetY: negative = figure stands higher up (depth effect).
         Clamp so top of figure never goes above 20px from canvas top. */
      const rawOffset = 100 - 250 * gsap.parseEase('power2.in')(Math.random());
      const minY      = 20;  // px from top — prevents head clipping
      const startY    = Math.max(minY, stage.height - peep.height + rawOffset);
      let startX, endX;
      if (direction === 1) {
        startX     = -peep.width;
        endX       = stage.width;
        peep.scaleX = 1;
      } else {
        startX     = stage.width + peep.width;
        endX       = 0;
        peep.scaleX = -1;
      }
      peep.x       = startX;
      peep.y       = startY;
      peep.anchorY = startY;
      return { startX, startY, endX };
    };

    /* ── CROWD STATE ── */
    const img            = document.createElement('img');
    const allPeeps       = [];
    const availablePeeps = [];
    const crowd          = [];

    const createPeeps = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      const rw = w / rows;
      const rh = h / cols;
      for (let i = 0; i < rows * cols; i++) {
        allPeeps.push(createPeep({
          image: img,
          rect: [
            (i % rows) * rw,
            ((i / rows) | 0) * rh,
            rw,
            rh,
          ],
        }));
      }
    };

    const addPeepToCrowd = () => {
      const peep = removeRandom(availablePeeps);
      const props = resetPeep({ peep, stage });
      const walk = getRandom(walks)({ peep, props })
        .eventCallback('onComplete', () => {
          removePeepFromCrowd(peep);
          addPeepToCrowd();
        });
      peep.walk = walk;
      crowd.push(peep);
      crowd.sort((a, b) => a.anchorY - b.anchorY);
      return peep;
    };

    const removePeepFromCrowd = (peep) => {
      removeItem(crowd, peep);
      availablePeeps.push(peep);
    };

    const initCrowd = () => {
      while (availablePeeps.length) {
        addPeepToCrowd().walk.progress(Math.random());
      }
    };

    /* ── RENDER LOOP (via gsap.ticker) ── */
    const render = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(devicePixelRatio, devicePixelRatio);
      crowd.forEach(p => p.render(ctx));
      ctx.restore();
    };

    /* ── RESIZE ── */
    const resize = () => {
      if (!canvas) return;
      stage.width  = canvas.clientWidth;
      stage.height = canvas.clientHeight;
      canvas.width  = stage.width  * devicePixelRatio;
      canvas.height = stage.height * devicePixelRatio;

      crowd.forEach(p => p.walk?.kill());
      crowd.length          = 0;
      availablePeeps.length = 0;
      availablePeeps.push(...allPeeps);
      initCrowd();
    };

    /* ── INIT ── */
    const init = () => {
      createPeeps();
      resize();
      gsap.ticker.add(render);
    };

    img.crossOrigin = 'anonymous';
    img.onload = init;
    img.src    = src;

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      gsap.ticker.remove(render);
      crowd.forEach(p => p.walk?.kill());
    };
  }, [src, rows, cols]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position : 'absolute',
        bottom   : 0,
        left     : 0,
        width    : '100%',
        height   : '100%',
        display  : 'block',
      }}
    />
  );
}
