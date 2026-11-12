import { useState, useRef, useEffect } from 'react';

const FAQS = [
  {
    q: 'What is SigmaVision?',
    a: 'SigmaVision is a smart assistive web application that works alongside the SmartCane hardware system. It provides caregivers and guardians with a real-time dashboard — live camera feed, GPS location tracking, obstacle detection alerts, and emergency features — all accessible from any device.',
  },
  {
    q: 'Who is SigmaVision built for?',
    a: 'SigmaVision is built for visually impaired individuals and the people who care for them. Caregivers, family members, and guardians can monitor and assist users remotely in real time, giving everyone more confidence and peace of mind.',
  },
  {
    q: 'How does the GPS tracking work?',
    a: 'The SmartCane sends live GPS coordinates to the SigmaVision dashboard. You can see the user\'s current location on an interactive map, track their movement history, and receive automatic landmark detection — so you always know exactly where they are.',
  },
  {
    q: 'What does the live camera feed show?',
    a: 'The SmartCane\'s onboard camera streams live video directly to your dashboard. This gives caregivers a real-time view of the user\'s immediate surroundings — helping identify obstacles, hazards, or unfamiliar environments before issues arise.',
  },
  {
    q: 'What happens when an emergency is detected?',
    a: 'If the SmartCane detects a fall, sudden stop, or obstacle collision, SigmaVision sends an immediate alert to connected caregivers. The dashboard highlights the event with the user\'s exact location so help can be dispatched quickly.',
  },
  {
    q: 'Do I need an account to use SigmaVision?',
    a: 'Yes — creating an account lets you securely connect to your SmartCane device and access all dashboard features. Sign up is free and takes less than a minute. Your data is kept private and only accessible to your authorised caregivers.',
  },
  {
    q: 'Who built SigmaVision?',
    a: 'SigmaVision was built by a research group from Naga City Science High School. Driven by a belief that technology should solve real problems, our team combined IoT hardware with assistive software to create a tool that genuinely improves lives.',
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
