"use client";
import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { cn } from "../../lib/utils";

/* ─── KBtn ──────────────────────────────────────────────────── */
function KBtn({ className, childrenClassName, backlit = true, children }) {
  return (
    <div className={cn("rounded-[4px] p-[0.5px]", backlit && "bg-white/[0.2] shadow-xl shadow-white")}>
      <div
        className={cn("flex h-6 w-6 items-center justify-center rounded-[3.5px] bg-[#0A090D]", className)}
        style={{ boxShadow: "0px -0.5px 2px 0 #0D0D0F inset, -0.5px 0px 2px 0 #0D0D0F inset" }}
      >
        <div className={cn("flex w-full flex-col items-center justify-center text-[5px] text-neutral-200", childrenClassName, backlit && "text-white")}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Keypad ────────────────────────────────────────────────── */
function Keypad() {
  return (
    <div className="mx-1 h-full rounded-md bg-[#050505] p-1">
      {/* Row 1 — function keys */}
      <div className="mb-[2px] flex w-full shrink-0 gap-[2px]">
        <KBtn className="w-10 items-end justify-start pb-[2px] pl-[4px]" childrenClassName="items-start">esc</KBtn>
        {["F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12"].map(f => (
          <KBtn key={f}><span className="mt-1 block">{f}</span></KBtn>
        ))}
        <KBtn>
          <div className="h-4 w-4 rounded-full bg-gradient-to-b from-neutral-900 from-20% via-black via-50% to-neutral-900 to-95% p-px">
            <div className="h-full w-full rounded-full bg-black" />
          </div>
        </KBtn>
      </div>
      {/* Row 2 */}
      <div className="mb-[2px] flex w-full shrink-0 gap-[2px]">
        <KBtn><span className="block">~</span><span className="mt-1 block">`</span></KBtn>
        {[["!","1"],["@","2"],["#","3"],["$","4"],["%","5"],["^","6"],["&","7"],["*","8"],["(","9"],[")",")0"],["_","_"],["+"," = "]].map(([t,b],i) => (
          <KBtn key={i}><span className="block">{t}</span><span className="block">{b}</span></KBtn>
        ))}
        <KBtn className="w-10 items-end justify-end pb-[2px] pr-[4px]" childrenClassName="items-end">delete</KBtn>
      </div>
      {/* Row 3 — QWERTY */}
      <div className="mb-[2px] flex w-full shrink-0 gap-[2px]">
        <KBtn className="w-10 items-end justify-start pb-[2px] pl-[4px]" childrenClassName="items-start">tab</KBtn>
        {"QWERTYUIOP".split("").map(k => <KBtn key={k}><span className="block">{k}</span></KBtn>)}
        <KBtn><span className="block">{"{"}</span><span className="block">{"["}</span></KBtn>
        <KBtn><span className="block">{"}"}</span><span className="block">{"]"}</span></KBtn>
        <KBtn><span className="block">|</span><span className="block">\</span></KBtn>
      </div>
      {/* Row 4 — ASDF */}
      <div className="mb-[2px] flex w-full shrink-0 gap-[2px]">
        <KBtn className="w-[2.8rem] items-end justify-start pb-[2px] pl-[4px]" childrenClassName="items-start">caps lock</KBtn>
        {"ASDFGHJKL".split("").map(k => <KBtn key={k}><span className="block">{k}</span></KBtn>)}
        <KBtn><span className="block">:</span><span className="block">;</span></KBtn>
        <KBtn><span className="block">"</span><span className="block">'</span></KBtn>
        <KBtn className="w-[2.85rem] items-end justify-end pb-[2px] pr-[4px]" childrenClassName="items-end">return</KBtn>
      </div>
      {/* Row 5 — ZXCV */}
      <div className="mb-[2px] flex w-full shrink-0 gap-[2px]">
        <KBtn className="w-[3.65rem] items-end justify-start pb-[2px] pl-[4px]" childrenClassName="items-start">shift</KBtn>
        {"ZXCVBNM".split("").map(k => <KBtn key={k}><span className="block">{k}</span></KBtn>)}
        <KBtn><span className="block">{"<"}</span><span className="block">{","}</span></KBtn>
        <KBtn><span className="block">{">"}</span><span className="block">{"."}</span></KBtn>
        <KBtn><span className="block">{"?"}</span><span className="block">{"/"}</span></KBtn>
        <KBtn className="w-[3.65rem] items-end justify-end pb-[2px] pr-[4px]" childrenClassName="items-end">shift</KBtn>
      </div>
      {/* Row 6 — bottom */}
      <div className="mb-[2px] flex w-full shrink-0 gap-[2px]">
        <KBtn childrenClassName="h-full justify-between py-[4px]">
          <div className="flex w-full justify-end pr-1"><span className="block">fn</span></div>
          <div className="flex w-full justify-start pl-1"><span className="text-[4px]">🌐</span></div>
        </KBtn>
        <KBtn childrenClassName="h-full justify-between py-[4px]">
          <div className="flex w-full justify-end pr-1"><span className="text-[4px]">⌃</span></div>
          <div className="flex w-full justify-start pl-1"><span className="block">control</span></div>
        </KBtn>
        <KBtn childrenClassName="h-full justify-between py-[4px]">
          <div className="flex w-full justify-end pr-1"><span className="text-[4px]">⌥</span></div>
          <div className="flex w-full justify-start pl-1"><span className="block">option</span></div>
        </KBtn>
        <KBtn className="w-8" childrenClassName="h-full justify-between py-[4px]">
          <div className="flex w-full justify-end pr-1"><span className="text-[4px]">⌘</span></div>
          <div className="flex w-full justify-start pl-1"><span className="block">command</span></div>
        </KBtn>
        <KBtn className="w-[8.2rem]" />
        <KBtn className="w-8" childrenClassName="h-full justify-between py-[4px]">
          <div className="flex w-full justify-start pl-1"><span className="text-[4px]">⌘</span></div>
          <div className="flex w-full justify-start pl-1"><span className="block">command</span></div>
        </KBtn>
        <KBtn childrenClassName="h-full justify-between py-[4px]">
          <div className="flex w-full justify-start pl-1"><span className="text-[4px]">⌥</span></div>
          <div className="flex w-full justify-start pl-1"><span className="block">option</span></div>
        </KBtn>
        <div className="mt-[2px] flex h-6 w-[4.9rem] flex-col items-center justify-end rounded-[4px] p-[0.5px]">
          <KBtn className="h-3 w-6"><span className="text-[6px]">▲</span></KBtn>
          <div className="flex">
            <KBtn className="h-3 w-6"><span className="text-[6px]">◀</span></KBtn>
            <KBtn className="h-3 w-6"><span className="text-[6px]">▼</span></KBtn>
            <KBtn className="h-3 w-6"><span className="text-[6px]">▶</span></KBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Screen content ────────────────────────────────────────── */
function MacScreenContent() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-[#161616] px-10">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <polygon points="18,2 33,10 33,26 18,34 3,26 3,10" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" fill="rgba(255,255,255,0.03)" />
        <circle cx="18" cy="18" r="6" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <circle cx="18" cy="18" r="2.5" fill="#ff6436" />
        <line x1="18" y1="2" x2="18" y2="12" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <line x1="18" y1="24" x2="18" y2="34" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <line x1="3"  y1="10" x2="12" y2="15" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <line x1="24" y1="21" x2="33" y2="26" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <line x1="33" y1="10" x2="24" y2="15" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <line x1="12" y1="21" x2="3"  y2="26" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      </svg>
      <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f1f1f1', margin: 0, textAlign: 'center' }}>
        SIGMAVISION
      </p>
      <div className="w-full max-w-[280px]">
        {[
          { label: 'GPS STATUS',      value: 'ACTIVE',    live: true },
          { label: 'CAMERA FEED',     value: 'STREAMING', live: true },
          { label: 'OBSTACLE ALERTS', value: 'ENABLED',   live: false },
          { label: 'LAST UPDATE',     value: 'JUST NOW',  live: false },
        ].map((r) => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7b7a7c' }}>{r.label}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: r.live ? '#ff6436' : '#a2a2a2' }}>
              {r.live && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff6436', display: 'inline-block' }} />}
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── MacbookScroll ─────────────────────────────────────────────
   Exact Aceternity pattern:
   - outer div: min-h-[200vh], overflow-hidden  → gives scroll distance
   - inner div: flex items-start justify-center, pt-28 → laptop at top
   - useScroll target = outer div, offset ["start start","end start"]
   - scaleX/Y open the lid, rotate tilts, translate slides screen up
─────────────────────────────────────────────────────────────── */
export function MacbookScroll({ src, showGradient, title, badge }) {
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const scaleX = useSpring(
    useTransform(scrollYProgress, [0, 0.3], [1.2, isMobile ? 1 : 1.5]),
    { stiffness: 100, damping: 30 }
  );
  const scaleY = useSpring(
    useTransform(scrollYProgress, [0, 0.3], [0.6, isMobile ? 1 : 1.5]),
    { stiffness: 100, damping: 30 }
  );
  const translate = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1500]),
    { stiffness: 100, damping: 30 }
  );
  const rotate = useSpring(
    useTransform(scrollYProgress, [0, 0.1, 0.3], [-28, -28, 0]),
    { stiffness: 100, damping: 30 }
  );
  const textTranslate = useSpring(
    useTransform(scrollYProgress, [0, 0.3], [0, 100]),
    { stiffness: 100, damping: 30 }
  );
  const textOpacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [1, 0]),
    { stiffness: 100, damping: 30 }
  );

  return (
    <div
      ref={ref}
      className="flex min-h-[120vh] shrink-0 scale-[0.35] flex-col items-center justify-start py-0 [perspective:600px] sm:scale-50 md:scale-100 md:pb-10 md:pt-4"
    >
      {title && (
        <motion.h2
          style={{ translateY: textTranslate, opacity: textOpacity }}
          className="mb-20 text-center text-3xl font-bold text-[#ffedd7]"
        >
          {title}
        </motion.h2>
      )}

      {/* ── LID ── */}
      <div className="relative" style={{ perspective: "800px" }}>
        {/* Back of lid — static */}
        <div
          style={{ transform: "perspective(800px) rotateX(-25deg) translateZ(0px)", transformOrigin: "bottom", transformStyle: "preserve-3d" }}
          className="relative h-[12rem] w-[32rem] rounded-2xl bg-[#010101] p-2"
        >
          <div
            style={{ boxShadow: "0px 2px 0px 2px var(--neutral-900) inset" }}
            className="absolute inset-0 flex items-center justify-center rounded-lg bg-[#010101]"
          >
            <svg width="65" height="65" viewBox="0 0 65 65" fill="none"
              style={{ background: "black", padding: "5px" }}
              className="h-7 w-7">
              <path d="M8 8.05571C8 8.05571 54.9009 18.1782 57.8687 30.062C60.8365 41.9458 9.05432 57.4696 9.05432 57.4696"
                stroke="#EA580C" strokeWidth="15" strokeMiterlimit="3.86874" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Animated screen lid — same h as lid back */}
        <motion.div
          style={{ scaleX, scaleY, rotateX: rotate, translateY: translate, transformStyle: "preserve-3d", transformOrigin: "50% 0%" }}
          className="absolute inset-0 h-96 w-[32rem] rounded-2xl bg-[#010101] p-2"
        >
          <div className="absolute inset-0 rounded-lg bg-[#161616]" />
          <div className="absolute inset-2 overflow-hidden rounded-lg bg-[#161616]">
            {src
              ? <img src={src} alt="screen" className="h-full w-full object-cover object-left-top" />
              : <MacScreenContent />
            }
          </div>
          {showGradient && (
            <div className="absolute inset-x-0 bottom-0 z-50 h-40 w-full bg-gradient-to-t from-white via-white to-transparent dark:from-black dark:via-black" />
          )}
        </motion.div>
      </div>

      {/* ── BASE ── */}
      <div className="relative -z-10 h-[22rem] w-[32rem] overflow-hidden rounded-2xl bg-[#272729]">
        <div className="relative h-10 w-full">
          <div className="absolute inset-x-0 mx-auto h-4 w-[80%] bg-[#050505]" />
        </div>
        <div className="relative flex">
          <div className="mx-auto h-full w-[10%] overflow-hidden">
            <div className="mt-2 flex h-40 gap-[2px] px-[0.5px]"
              style={{ backgroundImage: "radial-gradient(circle, #08080A 0.5px, transparent 0.5px)", backgroundSize: "3px 3px" }} />
          </div>
          <div className="mx-auto h-full w-[80%]"><Keypad /></div>
          <div className="mx-auto h-full w-[10%] overflow-hidden">
            <div className="mt-2 flex h-40 gap-[2px] px-[0.5px]"
              style={{ backgroundImage: "radial-gradient(circle, #08080A 0.5px, transparent 0.5px)", backgroundSize: "3px 3px" }} />
          </div>
        </div>
        <div className="mx-auto my-1 h-32 w-[40%] rounded-xl"
          style={{ boxShadow: "0px 0px 1px 1px #00000020 inset" }} />
        <div className="absolute inset-x-0 bottom-0 mx-auto h-2 w-20 rounded-tl-3xl rounded-tr-3xl bg-gradient-to-t from-[#272729] to-[#050505]" />
        {showGradient && (
          <div className="absolute inset-x-0 bottom-0 z-50 h-40 w-full bg-gradient-to-t from-white via-white to-transparent dark:from-black dark:via-black" />
        )}
        {badge && (
          <motion.div style={{ translateY: textTranslate, opacity: textOpacity }} className="absolute bottom-4 left-4">
            {badge}
          </motion.div>
        )}
      </div>
    </div>
  );
}
