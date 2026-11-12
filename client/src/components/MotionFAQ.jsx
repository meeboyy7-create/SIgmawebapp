import { useState, useRef, useEffect } from 'react';

const FAQS = [
  {
    q: 'What is SigmaVision?',
    a: 'A browser-based dashboard for monitoring someone who uses the S.I.G.M.A smart cane. You get a live camera feed from the cane, their GPS on a map, and the current obstacle sensor reading — all in one tab, no install.',
  },
  {
    q: 'Who is it for?',
    a: 'One person carries the cane. One person watches the dashboard. That\'s it. The caregiver can be a parent, a sibling, anyone — on a phone or a computer. The person with the cane doesn\'t need an account.',
  },
  {
    q: 'How does the location tracking work?',
    a: 'The cane user opens a separate URL on their phone and taps one button. Their device starts sending GPS coordinates to the dashboard over WebSocket. You see the dot move in real time. When they stop somewhere, the dashboard logs it.',
  },
  {
    q: 'What does the camera show?',
    a: 'Whatever is in front of the person right now — the path, a doorway, a crowded crossing. The stream is live and direct. It is not stored anywhere. You are watching the same moment they are walking through it.',
  },
  {
    q: 'How does the obstacle detection work?',
    a: 'Two sensors on the cane measure distance to whatever is ahead. When something enters the danger range, the cane vibrates and buzzes — the person knows before they reach it. The dashboard also shows the sensor state so you can see what triggered it.',
  },
  {
    q: 'What do I need to get started?',
    a: 'Power the camera module, connect it to Wi-Fi, and copy its stream URL. Log in to SigmaVision, open Setup, and paste the URL. Then have the cane user open the mobile tracking page. Once both are running, the dashboard shows everything.',
  },
  {
    q: 'Who made this?',
    a: 'A research team from Naga City Science High School. The hardware is real — built and tested. SigmaVision is the web layer that ties the camera, GPS, and sensors together into something a caregiver can actually use.',
  },
];

function FAQItem({ item, index, isOpen, onToggle }) {
  const bodyRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!bodyRef.current) return;
    if (isOpen) {
      setHeight(bodyRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [isOpen]);

  return (
    <div
      style={{
        borderBottom: '1px solid rgba(60,58,62,0.15)',
        overflow: 'hidden',
      }}
    >
      {/* Question row */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          padding: 'clamp(18px,2.5vh,28px) 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* index number */}
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.05em',
            color: '#a2a2a2',
            minWidth: 28,
            textTransform: 'uppercase',
          }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(16px,1.6vw,22px)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: '#3c3a3e',
            lineHeight: 1.2,
          }}>
            {item.q}
          </span>
        </div>

        {/* animated +/- icon */}
        <div style={{
          width: 32, height: 32,
          borderRadius: '50%',
          border: '1px solid rgba(60,58,62,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 0.25s, border-color 0.25s',
          background: isOpen ? '#3c3a3e' : 'transparent',
        }}>
          <svg
            width="14" height="14" viewBox="0 0 14 14"
            style={{ transition: 'transform 0.35s cubic-bezier(0.32,0.72,0,1)', transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
          >
            <line x1="7" y1="1" x2="7" y2="13" stroke={isOpen ? '#f8f8f8' : '#3c3a3e'} strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="1" y1="7" x2="13" y2="7" stroke={isOpen ? '#f8f8f8' : '#3c3a3e'} strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
      </button>

      {/* Answer — animates height */}
      <div style={{
        height,
        overflow: 'hidden',
        transition: 'height 0.4s cubic-bezier(0.32,0.72,0,1)',
      }}>
        <div ref={bodyRef} style={{ paddingBottom: 'clamp(18px,2.5vh,28px)', paddingLeft: 44 }}>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(14px,1.3vw,17px)',
            fontWeight: 400,
            lineHeight: 1.7,
            letterSpacing: '-0.01em',
            color: '#7b7a7c',
            margin: 0,
          }}>
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MotionFAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div>
      {FAQS.map((item, i) => (
        <FAQItem
          key={i}
          item={item}
          index={i}
          isOpen={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
        />
      ))}
    </div>
  );
}
