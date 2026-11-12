import { useEffect, useState, useRef, useCallback } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { motion, useReducedMotion } from 'framer-motion';
import { MapContainer, TileLayer, CircleMarker, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MotionFAQ from './components/MotionFAQ';
import BlurText from './components/BlurText';
import CrowdCanvas from './components/CrowdCanvas';
import MonitorSplash from './components/MonitorSplash';
import DashboardAnimator from './components/DashboardAnimator';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
gsap.registerPlugin(SplitText, CustomEase);

const S = {
  carbon:'#000000', paper:'#ffffff', sky:'#dceeff', gray:'#cccccc',
  blue:'#4da2ff', mint:'#55db9c', lavender:'#e9ccff',
  ember:'#fb4903', sun:'#ffd731', violet:'#5c4ade',
  f:{
    disp:"'Barlow Condensed','Bebas Neue',Impact,sans-serif",
    ui:"'DM Sans',ui-sans-serif,sans-serif",
    mono:"'IBM Plex Mono',ui-monospace,monospace",
  },
};

const ANIM_CSS = `
  @keyframes cam-float{0%{transform:rotate(-10deg) translateY(0px) scale(1)}30%{transform:rotate(0deg) translateY(-14px) scale(1.05)}60%{transform:rotate(8deg) translateY(-20px) scale(1.02)}80%{transform:rotate(4deg) translateY(-10px) scale(0.98)}100%{transform:rotate(-10deg) translateY(0px) scale(1)}}
  @keyframes map-sway{0%{transform:rotate(6deg) translateY(0px)}35%{transform:rotate(-5deg) translateY(-16px)}65%{transform:rotate(9deg) translateY(-8px)}100%{transform:rotate(6deg) translateY(0px)}}
  @keyframes badge-spin{0%,100%{transform:rotate(0deg) scale(1)}18%{transform:rotate(18deg) scale(1.14)}38%{transform:rotate(-12deg) scale(0.92)}58%{transform:rotate(9deg) scale(1.07)}78%{transform:rotate(-4deg) scale(0.97)}}
  @keyframes rocket-launch{0%{transform:translate(0,0) rotate(-18deg) scale(1);opacity:1}50%{transform:translate(14px,-30px) rotate(-12deg) scale(1.08);opacity:1}82%{transform:translate(22px,-50px) rotate(-16deg) scale(0.94);opacity:1}88%{transform:translate(26px,-60px) rotate(-20deg) scale(0.82);opacity:0}89%{transform:translate(-6px,14px) rotate(-14deg) scale(0.82);opacity:0}100%{transform:translate(0,0) rotate(-18deg) scale(1);opacity:1}}
  @keyframes mq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  @keyframes sigma-scroll-l{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  @keyframes sigma-scroll-r{from{transform:translateX(-50%)}to{transform:translateX(0)}}
  .sgr-l{display:flex;width:max-content;animation:sigma-scroll-l 18s linear infinite}
  .sgr-r{display:flex;width:max-content;animation:sigma-scroll-r 24s linear infinite}
  @keyframes stk-a{0%,100%{transform:translateY(0) rotate(-14deg) scale(1)}50%{transform:translateY(-18px) rotate(-10deg) scale(1.06)}}
  @keyframes stk-b{0%,100%{transform:translateY(-6px) rotate(10deg) scale(1)}50%{transform:translateY(10px) rotate(14deg) scale(1.04)}}
  @keyframes stk-c{0%,100%{transform:translateY(4px) rotate(-6deg) scale(1)}50%{transform:translateY(-14px) rotate(-10deg) scale(1.05)}}
  @keyframes stk-d{0%,100%{transform:translateY(0) rotate(18deg) scale(1)}50%{transform:translateY(-12px) rotate(14deg) scale(1.07)}}
  .stk-a{animation:stk-a 3.8s ease-in-out infinite}
  .stk-b{animation:stk-b 4.6s ease-in-out infinite}
  .stk-c{animation:stk-c 5.1s ease-in-out infinite}
  .stk-d{animation:stk-d 4.0s ease-in-out infinite}
  @keyframes sigma-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.7)}}
  @keyframes mon-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.7)}}
  @keyframes pfp-marker-pop{from{opacity:0;transform:scale(0.4)}to{opacity:1;transform:scale(1)}}
  @keyframes map-fade-in{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
  @keyframes page-enter{from{opacity:0;filter:blur(24px)}to{opacity:1;filter:blur(0px)}}
  @keyframes monitor-spring{0%{opacity:0;filter:blur(6px)}60%{opacity:1;filter:blur(0px)}100%{opacity:1;filter:blur(0px)}}
  /* active press feedback — anti-slop cure 5 */
  button:active:not(:disabled) { transform: scale(0.97) !important; transition: transform 60ms ease-out !important; }
`;

/* ── Map controller ── */
function MapCtrl({ pos }) {
  const map = useMap();
  useEffect(() => { if (pos) map.setView(pos, map.getZoom() || 16); }, [pos]);
  return null;
}

/* ── Custom pfp Leaflet marker ── */
function PfpMarker({ pos, pfpSrc, accent }) {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (!pos) return;
    const size = 44;
    const html = `
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        border:3px solid #000;overflow:hidden;
        background:${accent||'#55db9c'};
        box-shadow:3px 3px 0 ${S.carbon};
      ">
        ${pfpSrc
          ? `<img src="${pfpSrc}" style="width:100%;height:100%;object-fit:contain;object-position:center top;display:block;"/>`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;color:#000;font-family:Impact,sans-serif">?</div>`
        }
      </div>
      <div style="
        width:10px;height:10px;border-radius:50%;
        background:${accent||'#55db9c'};border:2px solid ${S.carbon};
        margin:-2px auto 0;
      "/>
    `;
    const icon = L.divIcon({
      html, className:'', iconSize:[size, size+12], iconAnchor:[size/2, size+12],
    });
    if (markerRef.current) {
      markerRef.current.setLatLng(pos);
      markerRef.current.setIcon(icon);
    } else {
      markerRef.current = L.marker(pos, { icon }).addTo(map);
    }
    return () => {
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
    };
  }, [pos, pfpSrc, accent]);

  return null;
}

/* ── MonScreen — pure Slush text style, bold, colorful, no icons ── */
function MonScreen({ camUrl, pos, activeProfile }) {
  const [mapVisible, setMapVisible] = useState(false);
  useEffect(() => { if (pos) { const t = setTimeout(() => setMapVisible(true), 80); return () => clearTimeout(t); } }, [!!pos]);
  return (
    <div style={{width:'100%',height:'100%',display:'flex',background:S.carbon}}>

      {/* LEFT — camera feed */}
      <div style={{flex:1,position:'relative',borderRight:`2.5px solid ${S.carbon}`,overflow:'hidden'}}>
        {camUrl ? (
          <>
            <img src={camUrl} alt="cam" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
            {/* LIVE badge */}
            <div style={{position:'absolute',top:6,left:6,background:S.ember,border:`2px solid ${S.carbon}`,borderRadius:8,padding:'2px 8px',display:'flex',alignItems:'center',gap:5,boxShadow:`2px 2px 0 ${S.carbon}`}}>
              <div style={{width:5,height:5,borderRadius:'50%',background:'#fff',animation:'mon-dot 1.4s ease-in-out infinite'}}/>
              <span style={{fontFamily:S.f.mono,fontSize:8,color:'#fff',letterSpacing:'0.12em',fontWeight:700}}>LIVE</span>
            </div>
          </>
        ) : (
          /* no signal — bold Slush text layout */
          <div style={{width:'100%',height:'100%',background:S.blue,display:'flex',flexDirection:'column',padding:'8px 10px',justifyContent:'space-between'}}>
            {/* top label */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <span style={{fontFamily:S.f.mono,fontSize:8,color:'rgba(255,255,255,0.55)',letterSpacing:'0.14em',textTransform:'uppercase'}}>CAMERA</span>
              <div style={{width:6,height:6,borderRadius:'50%',background:'rgba(255,255,255,0.3)'}}/>
            </div>
            {/* big bold text */}
            <div>
              <div style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(16px,2.8vw,32px)',color:'#fff',lineHeight:.85,textTransform:'uppercase',letterSpacing:'-0.01em'}}>NO<br/>FEED</div>
              <div style={{fontFamily:S.f.ui,fontSize:'clamp(7px,1vw,10px)',fontWeight:600,color:'rgba(255,255,255,0.55)',marginTop:4,lineHeight:1.4}}>Paste camera URL<br/>in Setup</div>
            </div>
            {/* bottom accent */}
            <div style={{height:3,borderRadius:99,background:'rgba(255,255,255,0.25)'}}/>
          </div>
        )}
        {/* CAM label */}
        <div style={{position:'absolute',bottom:5,left:6,background:S.carbon,borderRadius:5,padding:'1px 6px',zIndex:1}}>
          <span style={{fontFamily:S.f.mono,fontSize:7,color:'#fff',letterSpacing:'0.12em',textTransform:'uppercase'}}>CAM</span>
        </div>
      </div>

      {/* RIGHT — GPS map */}
      <div style={{flex:1,position:'relative',overflow:'hidden'}}>
        {pos ? (
          <div style={{ width:'100%', height:'100%', opacity: mapVisible ? 1 : 0, transform: mapVisible ? 'scale(1)' : 'scale(0.96)', transition: 'opacity .6s cubic-bezier(.22,1,.36,1), transform .6s cubic-bezier(.22,1,.36,1)' }}>
          <MapContainer center={pos} zoom={16} style={{width:'100%',height:'100%'}} zoomControl={false} attributionControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
            <MapCtrl pos={pos}/>
            {/* pfp marker — falls back to CircleMarker if Leaflet DivIcon fails */}
            {activeProfile?.image
              ? <PfpMarker pos={pos} pfpSrc={activeProfile.image} accent={activeProfile.accent}/>
              : <>
                  <CircleMarker center={pos} radius={20} pathOptions={{color:S.mint,fillColor:'transparent',weight:2,opacity:.4}}/>
                  <CircleMarker center={pos} radius={9}  pathOptions={{color:S.carbon,fillColor:S.mint,fillOpacity:1,weight:2.5}}/>
                </>
            }
          </MapContainer>
          </div>
        ) : (
          /* no GPS — bold Slush text layout */
          <div style={{width:'100%',height:'100%',background:S.mint,display:'flex',flexDirection:'column',padding:'8px 10px',justifyContent:'space-between'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <span style={{fontFamily:S.f.mono,fontSize:8,color:'rgba(0,0,0,0.45)',letterSpacing:'0.14em',textTransform:'uppercase'}}>LOCATION</span>
              <div style={{width:6,height:6,borderRadius:'50%',background:'rgba(0,0,0,0.2)'}}/>
            </div>
            <div>
              <div style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(16px,2.8vw,32px)',color:S.carbon,lineHeight:.85,textTransform:'uppercase',letterSpacing:'-0.01em'}}>NO<br/>GPS</div>
              <div style={{fontFamily:S.f.ui,fontSize:'clamp(7px,1vw,10px)',fontWeight:600,color:'rgba(0,0,0,0.5)',marginTop:4,lineHeight:1.4}}>Open tracking page<br/>on their phone</div>
            </div>
            <div style={{height:3,borderRadius:99,background:'rgba(0,0,0,0.18)'}}/>
          </div>
        )}
        {/* GPS label */}
        <div style={{position:'absolute',bottom:5,right:6,zIndex:999,background:S.carbon,borderRadius:5,padding:'1px 6px'}}>
          <span style={{fontFamily:S.f.mono,fontSize:7,color:'#fff',letterSpacing:'0.12em',textTransform:'uppercase'}}>GPS</span>
        </div>
      </div>
    </div>
  );
}

/* ── Monitor + Table ── */
function Monitor({ tableRef, monRef, isAuth, camUrl, pos, onZoom, activeProfile, monitorReady }) {
  return (
    <>
      {/* TABLE */}
      <div ref={tableRef} style={{position:'absolute',left:'50%',bottom:0,width:'min(140vw,2000px)',transformOrigin:'50% 100%',zIndex:3,willChange:'transform',contain:'layout style',transform:'translateX(-50%) translateY(600px) scale(0.55)'}}>
        <svg viewBox="0 0 1440 172" preserveAspectRatio="none" style={{width:'100%',height:'172px',display:'block',overflow:'visible'}}>
          <defs>
            <linearGradient id="tg-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f5efe6"/><stop offset="55%" stopColor="#ede3d4"/><stop offset="100%" stopColor="#ddd0be"/></linearGradient>
            <linearGradient id="tg-front" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ede3d4"/><stop offset="55%" stopColor="#ddd0be"/><stop offset="100%" stopColor="#cdc0ac"/></linearGradient>
            <linearGradient id="tg-side" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e8ddd0"/><stop offset="55%" stopColor="#d4c8b8"/><stop offset="100%" stopColor="#c4b8a4"/></linearGradient>
            <linearGradient id="tg-shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="white" stopOpacity="0"/><stop offset="50%" stopColor="white" stopOpacity="0.95"/><stop offset="100%" stopColor="white" stopOpacity="0"/></linearGradient>
          </defs>
          <rect x="0" y="52" width="1440" height="120" fill="url(#tg-front)"/>
          <polygon points="0,52 110,0 110,172 0,172" fill="url(#tg-side)"/>
          <polygon points="1440,52 1330,0 1330,172 1440,172" fill="url(#tg-side)"/>
          <polygon points="110,0 1330,0 1440,52 0,52" fill="url(#tg-top)"/>
          <polygon points="110,0 1330,0 1440,52 0,52" fill="url(#tg-shine)" opacity="0.6"/>
          <polygon points="110,0 1330,0 1440,52 0,52" fill="rgba(220,238,255,0.14)"/>
          <polygon points="110,0 1330,0 1440,52 0,52" fill="none" stroke="#000" strokeWidth="1.5"/>
          <line x1="0" y1="52" x2="0" y2="172" stroke="#000" strokeWidth="1.5"/>
          <line x1="1440" y1="52" x2="1440" y2="172" stroke="#000" strokeWidth="1.5"/>
          <line x1="0" y1="172" x2="1440" y2="172" stroke="#000" strokeWidth="1.5"/>
          <ellipse cx="720" cy="176" rx="680" ry="14" fill="rgba(0,0,0,0.13)"/>
        </svg>
      </div>
      {/* MONITOR — apple_monitor.png + screen content overlaid inside same div */}
      <div ref={monRef}
        className="mon-glow"
        style={{position:'absolute',left:'50%',bottom:0,width:'min(46vw,600px)',transformOrigin:'50% 100%',zIndex:4,willChange:'transform',transform:'translateX(-50%) translateY(480px) scale(0.55)',cursor:isAuth?'zoom-in':'default'}}
        onClick={isAuth?onZoom:undefined}>
        <div style={{position:'relative',width:'100%'}}>
        {/* screen content FIRST — fills the full glass area behind the frame */}
        {isAuth ? (
          <div style={{
            position:'absolute',
            top:'0.21%', left:'0.16%', right:'0.16%', bottom:'24.47%',
            overflow:'hidden',
            borderRadius:2,
            cursor:'zoom-in',
            zIndex:1,
          }} onClick={e=>{e.stopPropagation();onZoom();}}>
            <MonScreen camUrl={camUrl} pos={pos} activeProfile={activeProfile}/>
            <div style={{position:'absolute',bottom:7,left:'50%',transform:'translateX(-50%)',background:'rgba(0,0,0,0.7)',borderRadius:8,padding:'3px 10px',display:'flex',alignItems:'center',gap:5,pointerEvents:'none'}}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              <span style={{fontFamily:S.f.mono,fontSize:7,color:'#fff',letterSpacing:'0.12em',textTransform:'uppercase'}}>Click to expand</span>
            </div>
          </div>
        ) : (
          /* logged out — splash animation after monitor rises, plain dark before */
          <div style={{position:'absolute',top:'0.21%',left:'0.16%',right:'0.16%',bottom:'24.47%',borderRadius:2,zIndex:1,overflow:'hidden'}}>
            {monitorReady ? <MonitorSplash /> : <div style={{width:'100%',height:'100%',background:S.carbon}}/>}
          </div>
        )}
        {/* monitor frame PNG on top — screen area is transparent so content shows through,
            bezel/stand remain opaque and visible */}
        <img src="/monitor_frame.png" alt="Monitor"
          style={{width:'100%',display:'block',filter:'drop-shadow(0 6px 36px rgba(0,0,0,0.92))',position:'relative',zIndex:2,pointerEvents:'none'}}/>
        </div>
      </div>
    </>
  );
}

/* ── Shared UI ── */
const icons = {
  camera:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  location:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  shield:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  bell:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  check:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  star:<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  rocket:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
};
const Sticker=({color,size=52,rotate=0,icon,style})=>(<div style={{width:size,height:size,background:color,border:`1.5px solid ${S.carbon}`,borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center',transform:`rotate(${rotate}deg)`,flexShrink:0,userSelect:'none',color:S.carbon,...style}}><div style={{width:size*.48,height:size*.48}}>{icons[icon]}</div></div>);
const PillNav=({children,onClick,active})=>(<button onClick={onClick} onMouseEnter={e=>{e.currentTarget.style.background=S.carbon;e.currentTarget.style.color=S.paper;}} onMouseLeave={e=>{e.currentTarget.style.background=active?S.carbon:S.paper;e.currentTarget.style.color=active?S.paper:S.carbon;}} style={{fontFamily:S.f.ui,fontWeight:700,fontSize:13,letterSpacing:'0.032em',textTransform:'uppercase',color:active?S.paper:S.carbon,background:active?S.carbon:S.paper,border:`1px solid ${S.carbon}`,borderRadius:9999,padding:'8px 16px',cursor:'pointer',whiteSpace:'nowrap',transition:'background .18s,color .18s'}}>{children}</button>);
const PillNavDark=({children,onClick})=>(<button onClick={onClick} onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.15)';}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';}} style={{fontFamily:S.f.ui,fontWeight:700,fontSize:13,letterSpacing:'0.032em',textTransform:'uppercase',color:S.paper,background:'rgba(255,255,255,0.08)',border:`1px solid rgba(255,255,255,0.18)`,borderRadius:9999,padding:'8px 16px',cursor:'pointer',whiteSpace:'nowrap',transition:'background .18s'}}>{children}</button>);
const CtaBtn=({children,onClick,outline})=>(<button onClick={onClick} onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.04)';e.currentTarget.style.opacity='.88';}} onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.opacity='1';}} style={{fontFamily:S.f.ui,fontWeight:700,fontSize:14,letterSpacing:'0.032em',color:outline?S.carbon:S.paper,background:outline?S.paper:S.carbon,border:`1px solid ${S.carbon}`,borderRadius:9999,padding:'12px 28px',cursor:'pointer',transition:'transform .18s,opacity .18s'}}>{children}</button>);
const CtaBtnDark=({children,onClick})=>(<button onClick={onClick} onMouseEnter={e=>{e.currentTarget.style.opacity='.75';}} onMouseLeave={e=>{e.currentTarget.style.opacity='1';}} style={{fontFamily:S.f.ui,fontWeight:700,fontSize:14,letterSpacing:'0.032em',color:S.carbon,background:S.paper,border:`1px solid rgba(255,255,255,0.25)`,borderRadius:9999,padding:'12px 28px',cursor:'pointer',transition:'opacity .18s'}}>{children}</button>);
const Tag=({children,color})=>(<span style={{fontFamily:S.f.ui,fontWeight:700,fontSize:12,letterSpacing:'0.032em',textTransform:'uppercase',color:S.carbon,background:color||S.lavender,border:`1px solid ${S.carbon}`,borderRadius:9999,padding:'5px 14px',whiteSpace:'nowrap'}}>{children}</span>);

/* live status pill with pulsing dot */
const StatusPill=({label,active,color})=>(
  <div style={{display:'flex',alignItems:'center',gap:7,
    background:active?color:'rgba(255,255,255,0.08)',
    border:`2px solid ${active?color:'rgba(255,255,255,0.15)'}`,
    borderRadius:9999,padding:'7px 16px',
    boxShadow:active?`3px 3px 0 ${color}33`:'none',
    transition:'background .2s,border-color .2s'}}>
    <div style={{width:7,height:7,borderRadius:'50%',
      background:active?S.carbon:'rgba(255,255,255,0.3)',
      border:active?`1.5px solid rgba(0,0,0,0.2)`:'none',
      animation:active?'sigma-dot 1.4s ease-in-out infinite':'none',flexShrink:0}}/>
    <span style={{fontFamily:S.f.mono,fontWeight:700,fontSize:10,letterSpacing:'0.12em',textTransform:'uppercase',
      color:active?S.carbon:S.paper}}>{label}</span>
  </div>
);

/* quick-action pill button */
const PillBtn=({children,onClick,color})=>{
  const [hov,setHov]=useState(false);
  return(
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{fontFamily:S.f.ui,fontWeight:700,fontSize:12,letterSpacing:'0.032em',textTransform:'uppercase',color:S.carbon,background:hov?S.carbon:color,border:`2px solid ${S.carbon}`,borderRadius:9999,padding:'7px 18px',cursor:'pointer',transition:'background .15s,color .15s',boxShadow:`3px 3px 0 ${S.carbon}`,color:hov?S.paper:S.carbon}}>
      {children}
    </button>
  );
};
const FeatureCard=({n,title,desc,accent,icon})=>(<motion.div initial={{opacity:0,y:32}} whileInView={{opacity:1,y:0}} transition={{duration:.55,ease:[.22,1,.36,1]}} viewport={{once:true}} style={{background:accent,border:`1px solid ${S.carbon}`,borderRadius:20,padding:28,display:'flex',flexDirection:'column',gap:14}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><span style={{fontFamily:S.f.mono,fontSize:11,color:S.carbon,opacity:.45,letterSpacing:'0.14em'}}>{n}</span><Sticker color={S.paper} size={36} icon={icon} rotate={-5} style={{borderRadius:10}}/></div><h3 style={{fontFamily:S.f.ui,fontSize:20,fontWeight:700,color:S.carbon,margin:0,lineHeight:1.22,letterSpacing:'-0.01em'}}>{title}</h3><div style={{width:24,height:2,background:S.carbon,opacity:.18,borderRadius:99}}/><p style={{fontFamily:S.f.ui,fontSize:14,fontWeight:500,lineHeight:1.65,color:S.carbon,opacity:.65,margin:0}}>{desc}</p></motion.div>);

function FloatSticker({src,alt,size=130,animName,animDur='4.5s',rotate=0,style={}}) {
  const ref=useRef(null);
  const [tilt,setTilt]=useState({x:0,y:0,on:false});
  const [pull,setPull]=useState({x:0,y:0});
  const onMove=e=>{const el=ref.current;if(!el)return;const r=el.getBoundingClientRect();const cx=(e.clientX-r.left)/r.width-0.5,cy=(e.clientY-r.top)/r.height-0.5;const dist=Math.sqrt(cx*cx+cy*cy),mag=Math.max(0,1-dist*2.0);setPull({x:cx*mag*28,y:cy*mag*28});setTilt({x:cy*-30,y:cx*30,on:true});};
  const onLeave=()=>{setPull({x:0,y:0});setTilt({x:0,y:0,on:false});};
  return(<div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{width:size,height:size,flexShrink:0,userSelect:'none',cursor:'pointer',animation:tilt.on?'none':`${animName} ${animDur} ease-in-out infinite`,transform:tilt.on?`translate(${pull.x}px,${pull.y}px) rotate(${rotate}deg) perspective(480px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.18)`:`rotate(${rotate}deg)`,transformStyle:'preserve-3d',filter:`drop-shadow(${-tilt.y*.5}px ${tilt.x*.5+14}px ${tilt.on?44:18}px rgba(0,0,0,${tilt.on?.48:.22}))`,transition:tilt.on?'filter .07s':'transform .7s cubic-bezier(.22,1,.36,1),filter .7s cubic-bezier(.22,1,.36,1)',willChange:'transform',...style}}><img src={src} alt={alt} draggable={false} style={{width:'100%',height:'100%',objectFit:'contain',display:'block'}}/></div>);
}

function Marquee(){const msg='\u00a0\u00a0\u2014\u00a0SMART CANE\u00a0\u00a0\u2014\u00a0LIVE CAMERA\u00a0\u00a0\u2014\u00a0GPS TRACKING\u00a0\u00a0\u2014\u00a0OBSTACLE SENSING\u00a0\u00a0\u2014\u00a0CAREGIVER DASHBOARD\u00a0\u00a0\u2014\u00a0SIGMAVISION\u00a0\u00a0';return(<div style={{background:S.carbon,overflow:'hidden'}}><div style={{display:'flex',whiteSpace:'nowrap',animation:'mq 24s linear infinite',width:'max-content',padding:'10px 0'}}>{[0,1,2,3].map(i=><span key={i} style={{fontFamily:S.f.ui,fontWeight:700,fontSize:12,letterSpacing:'0.032em',color:S.paper}}>{msg}</span>)}</div></div>);}

function Ribbon({flip=false,style}){const id=flip?'rbf':'rbg';return(<div style={{position:'absolute',left:0,right:0,pointerEvents:'none',overflow:'visible',...style}}><svg viewBox="0 0 1440 320" preserveAspectRatio="none" fill="none" style={{width:'100%',height:'100%',display:'block',transform:flip?'scaleY(-1)':'none'}}><defs><filter id={id} x="-5%" y="-30%" width="110%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="4" stitchTiles="stitch" result="n"/><feColorMatrix type="saturate" values="0" in="n" result="gn"/><feBlend in="SourceGraphic" in2="gn" mode="multiply" result="b"/><feComposite in="b" in2="SourceGraphic" operator="in"/></filter></defs><path d="M-40 220 C200 80 500 20 720 110 C940 200 1200 60 1480 180" stroke="rgba(0,0,0,0.14)" strokeWidth="90" strokeLinecap="round" fill="none"/><path d="M-40 210 C200 70 500 10 720 100 C940 190 1200 50 1480 168" stroke={S.blue} strokeWidth="82" strokeLinecap="round" fill="none" filter={`url(#${id})`}/><path d="M-40 182 C200 46 500 -14 720 74 C940 162 1200 24 1480 140" stroke="rgba(255,255,255,0.38)" strokeWidth="22" strokeLinecap="round" fill="none"/><path d="M-40 172 C200 38 500 -20 720 66 C940 154 1200 16 1480 132" stroke="rgba(255,255,255,0.14)" strokeWidth="8" strokeLinecap="round" fill="none"/><path d="M-40 236 C200 96 500 38 720 126 C940 216 1200 78 1480 196" stroke="rgba(0,0,0,0.12)" strokeWidth="18" strokeLinecap="round" fill="none"/></svg></div>);}

/* ── Orbit Card Stack — adapted from source, Slush themed, portrait-only ── */
const ORBIT_ITEMS = [
  { name: 'User A', accent: '#55db9c', initials: 'UA', image: '/pfp-1.png' },
  { name: 'User B', accent: '#4da2ff', initials: 'UB', image: '/pfp-2.png' },
  { name: 'User C', accent: '#ffd731', initials: 'UC', image: '/pfp-3.png' },
  { name: 'User D', accent: '#fb4903', initials: 'UD', image: '/pfp-4.png' },
  { name: 'User E', accent: '#5c4ade', initials: 'UE', image: '/pfp-5.png' },
];

function OrbitPortrait({ item }) {
  return (
    <div style={{
      position:'relative', width:'100%', aspectRatio:'1.36',
      borderRadius:20, overflow:'hidden',
      background: item.accent,
      border:`2px solid ${S.carbon}`,
    }}>
      {item.image ? (
        <img src={item.image} alt={item.name}
          style={{ width:'100%', height:'100%', objectFit:'contain', objectPosition:'center top', display:'block' }}/>
      ) : (
        <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontFamily:S.f.disp, fontWeight:900, fontSize:48, color:S.carbon, opacity:.4 }}>{item.initials}</span>
        </div>
      )}
      <span style={{ position:'absolute', bottom:6, right:8, background:S.carbon, borderRadius:9999, padding:'2px 8px', fontFamily:S.f.mono, fontSize:9, fontWeight:700, letterSpacing:'0.18em', color:'#fff', zIndex:3 }}>
        {item.initials}
      </span>
    </div>
  );
}

function OrbitCardStack({ onSelect }) {
  const reduceMotion = useReducedMotion() ?? false;
  const cards = ORBIT_ITEMS;
  const restingIndex = 2;
  const [activeIndex, setActiveIndex] = useState(restingIndex);
  const [open, setOpen] = useState(false);
  const stageRef = useRef(null);
  const spread = 168, lift = 34;
  const midpoint = (cards.length - 1) / 2;

  const layouts = cards.map((_, index) => {
    const orbit = index - midpoint;
    const stack = index - restingIndex;
    return {
      open:   { x: orbit * spread, y: Math.abs(orbit)*30 + Math.max(0,Math.abs(orbit)-1)*10, rotation: orbit*8.5 },
      closed: { x: stack * 10,     y: Math.abs(stack)*5,  rotation: stack*2.8 },
    };
  });

  const activate = (i) => { setOpen(true); setActiveIndex(i); };
  const close    = () => { setOpen(false); setActiveIndex(restingIndex); };

  return (
    <div style={{ position:'relative', height:420, width:'100%', maxWidth:1060 }}
      ref={stageRef} onMouseLeave={close} role="list">
      {cards.map((item, index) => {
        const pos = open ? layouts[index].open : layouts[index].closed;
        const active = index === activeIndex;
        const tf = `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y - (open&&active?lift:0)}px)) rotate(${pos.rotation}deg) scale(${open?0.985:0.97})`;
        return (
          <div key={index} role="button" tabIndex={0} aria-label={`Select profile ${item.name}`}
            onMouseEnter={() => activate(index)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { if (active && open) onSelect(item); else activate(index); } }}
            onClick={() => {
              if (active && open) {
                // second click = confirm selection → set profile + close panel
                onSelect(item);
              } else {
                activate(index);
              }
            }}
            style={{
              position:'absolute', left:'50%', top:'50%',
              width:'min(78vw,22rem)',
              transform: tf,
              transition: reduceMotion ? 'none' : 'transform 420ms cubic-bezier(.2,.8,.2,1)',
              zIndex: active ? 80 : 50 - Math.abs(index - activeIndex),
              cursor:'pointer',
              borderRadius:26,
              border:`2.5px solid ${S.carbon}`,
              background: S.paper,
              padding:12,
              boxShadow: active && open ? `6px 8px 0 ${S.carbon}` : `3px 4px 0 ${S.carbon}`,
              userSelect:'none',
            }}>
            <OrbitPortrait item={item}/>
            <div style={{ padding:'10px 6px 6px' }}>
              <div style={{ fontFamily:S.f.mono, fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:S.carbon, opacity:.45 }}>GUARDIAN</div>
              <div style={{ fontFamily:S.f.disp, fontWeight:900, fontSize:24, lineHeight:.95, letterSpacing:'-0.02em', color:S.carbon, marginTop:5, textTransform:'uppercase' }}>{item.name}</div>
              <div style={{ marginTop:10, borderTop:`1px solid rgba(0,0,0,0.1)`, paddingTop:7, fontFamily:S.f.mono, fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:S.carbon, opacity:.4 }}>
                {active && open ? 'Tap again to select' : 'PROFILE'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Profile card shown below the monitor after selection ── */
function ProfileCard({ item, locHistory, pos, displayName, setDisplayName, editingName, setEditingName, onClear }) {
  const latest   = locHistory[locHistory.length - 1] || null;
  const location = latest ? (latest.loading ? 'Resolving…' : latest.landmark || 'Unknown area') : 'No GPS data yet';
  const since    = latest ? `Since ${latest.arrived}` : '—';
  const lastSeen = latest ? latest.lastSeen : '—';

  return (
    <motion.div initial={{ opacity:0, y:32 }} animate={{ opacity:1, y:0 }} transition={{ duration:.55, ease:[.22,1,.36,1] }}
      style={{ maxWidth:900, margin:'0 auto' }}>

      <div style={{
        background: S.paper,
        border: `2px solid ${S.carbon}`,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: `6px 7px 0 ${S.carbon}`,
      }}>

        {/* ── HEADER ── */}
        <div style={{
          background: item.accent,
          borderBottom: `2px solid ${S.carbon}`,
          padding: 'clamp(20px,3vh,32px) clamp(24px,3vw,40px)',
          display: 'flex', alignItems: 'center', gap: 20,
        }}>
          {item.image && (
            <div style={{
              width: 72, height: 72, borderRadius: 9999, flexShrink: 0,
              overflow: 'hidden', border: `2.5px solid ${S.carbon}`,
              background: item.accent, boxShadow: `3px 3px 0 ${S.carbon}`,
            }}>
              <img src={item.image} alt={displayName}
                style={{ width:'100%', height:'100%', objectFit:'contain', objectPosition:'center top', display:'block' }}/>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontFamily:S.f.mono, fontSize:10, letterSpacing:'0.16em', textTransform:'uppercase', color:S.carbon, opacity:.5, display:'block', marginBottom:6 }}>Monitoring</span>
            {editingName ? (
              <input autoFocus value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={e => e.key==='Enter' && setEditingName(false)}
                style={{ fontFamily:S.f.disp, fontWeight:900, fontSize:'clamp(28px,4vw,48px)', lineHeight:.88, textTransform:'uppercase', color:S.carbon, background:'transparent', border:'none', borderBottom:`2px solid ${S.carbon}`, outline:'none', minWidth:140, width:'100%' }}/>
            ) : (
              <div style={{ display:'flex', alignItems:'baseline', gap:10, flexWrap:'wrap' }}>
                <span style={{ fontFamily:S.f.disp, fontWeight:900, fontSize:'clamp(28px,4vw,48px)', lineHeight:.88, textTransform:'uppercase', color:S.carbon }}>{displayName}</span>
                <button onClick={() => setEditingName(true)}
                  style={{ fontFamily:S.f.mono, fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:S.carbon, opacity:.38, background:'none', border:'none', cursor:'pointer', padding:'2px 6px' }}>edit</button>
              </div>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:pos?S.carbon:'rgba(0,0,0,0.22)', border:`1.5px solid ${S.carbon}`, animation:pos?'sigma-dot 1.4s ease-in-out infinite':'none' }}/>
            <span style={{ fontFamily:S.f.mono, fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:S.carbon, opacity:.5 }}>{pos?'LIVE':'OFFLINE'}</span>
          </div>
          <button onClick={onClear} aria-label="Clear selected profile"
            style={{ width:36, height:36, borderRadius:9999, border:`2px solid ${S.carbon}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginLeft:4 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={S.carbon} strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* ── TILES ── asymmetric: location tall left, 2×2 right */}
        <div style={{
          padding: 'clamp(20px,2.5vh,28px) clamp(24px,3vw,40px) 0',
          display: 'grid',
          gridTemplateColumns: 'minmax(0,2.2fr) minmax(0,1fr) minmax(0,1fr)',
          gridTemplateRows: '1fr 1fr',
          gap: 14,
        }}>
          {/* Current Location — spans full left column */}
          <div style={{
            gridRow: '1 / 3',
            background: S.mint, border: `2px solid ${S.carbon}`,
            borderRadius: 12, padding: 'clamp(18px,2.5vh,28px) clamp(18px,2vw,28px)',
            boxShadow: `4px 4px 0 ${S.carbon}`,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            minHeight: 160,
          }}>
            <span style={{ fontFamily:S.f.mono, fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:S.carbon, opacity:.5 }}>Current Location</span>
            <span style={{ fontFamily:S.f.ui, fontSize:'clamp(16px,1.8vw,22px)', fontWeight:700, color:S.carbon, lineHeight:1.3, wordBreak:'break-word' }}>{location}</span>
          </div>
          <LocationTile label="Time at Spot"  value={since}                       color={S.sun}/>
          <LocationTile label="Last Update"   value={lastSeen}                    color={S.lavender}/>
          <LocationTile label="GPS Status"    value={pos?'Tracking':'No signal'}  color={pos?S.sky:S.gray}/>
          <LocationTile label="Stops Logged"  value={String(locHistory.length)}   color={S.sky}/>
        </div>

        {locHistory.length === 0 && <div style={{ height:20 }}/>}

        {/* ── HISTORY ── */}
        {locHistory.length > 0 && (
          <div style={{ padding:'clamp(16px,2vh,24px) clamp(24px,3vw,40px) clamp(20px,2.5vh,28px)' }}>
            <div style={{ fontFamily:S.f.mono, fontSize:10, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:S.carbon, opacity:.38, marginBottom:12 }}>Location History</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {locHistory.slice().reverse().slice(0,5).map((h,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', background:i===0?S.sky:'rgba(0,0,0,0.02)', borderRadius:10, border:`1.5px solid ${i===0?S.carbon:'rgba(0,0,0,0.08)'}` }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:i===0?S.carbon:S.gray, flexShrink:0 }}/>
                  <span style={{ fontFamily:S.f.ui, fontSize:13, fontWeight:600, color:S.carbon, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.loading?'Resolving…':h.landmark||'Unknown area'}</span>
                  <span style={{ fontFamily:S.f.mono, fontSize:10, color:S.carbon, opacity:.38, flexShrink:0 }}>{h.arrived}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function LocationTile({ label, value, color }) {
  return (
    <div style={{
      background: color, border: `2px solid ${S.carbon}`,
      borderRadius: 12, padding: 'clamp(14px,2vh,20px) clamp(14px,1.8vw,20px)',
      boxShadow: `3px 3px 0 ${S.carbon}`,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      minHeight: 72,
    }}>
      <div style={{ fontFamily:S.f.mono, fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:S.carbon, opacity:.45, marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:S.f.ui, fontSize:'clamp(13px,1.4vw,17px)', fontWeight:700, color:S.carbon, lineHeight:1.3, wordBreak:'break-word' }}>{value}</div>
    </div>
  );
}

/* ── Tutorial Modal — 4-step Slush style ── */
function TutorialModal({ onClose, user }) {
  const [step, setStep] = useState(0);
  const STEPS = [
    { color:S.blue,    title:'POWER ON',  body:'Plug your ESP32-CAM into the smart cane battery pack. The status LED blinks when it is booting up.' },
    { color:S.mint,    title:'JOIN WIFI', body:'Connect the ESP32-CAM to your Wi-Fi network. Copy its IP address and paste it in the Setup panel.' },
    { color:S.sun,     title:'GPS LINK',  body:'Have the cane user open the GPS tracker on their phone. The link is shown below — send it to them via WhatsApp or SMS. They tap one button and your map updates.' },
    { color:S.lavender,title:'ALL SET',   body:'Camera feed on the left, live GPS on the right. Click the monitor screen to expand to fullscreen.' },
  ];
  const cur = STEPS[step];
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.6)' }}/>
      <div style={{ position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:201,width:'min(94vw,380px)' }}>
        <div style={{ background:S.paper,border:`2.5px solid ${S.carbon}`,borderRadius:12,overflow:'hidden',boxShadow:`7px 8px 0 ${S.carbon}` }}>
          <div style={{ background:cur.color,borderBottom:`2.5px solid ${S.carbon}`,padding:'20px 24px 16px',display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
            <div>
              <div style={{ fontFamily:S.f.mono,fontSize:10,letterSpacing:'0.14em',color:S.carbon,opacity:.55,marginBottom:6 }}>STEP {step+1} / {STEPS.length}</div>
              <div style={{ fontFamily:S.f.disp,fontWeight:900,fontSize:46,lineHeight:.88,textTransform:'uppercase',color:S.carbon }}>{cur.title}</div>
            </div>
            <button onClick={onClose} aria-label="Close" style={{ width:34,height:34,borderRadius:9999,border:`2px solid ${S.carbon}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={S.carbon} strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div style={{ padding:'26px 24px 24px',display:'flex',flexDirection:'column',gap:20 }}>
            <p style={{ fontFamily:S.f.ui,fontSize:14,fontWeight:500,lineHeight:1.68,color:S.carbon,opacity:.7,margin:0 }}>{cur.body}</p>
            {/* step 3 — show the mobile GPS link so user can copy/share it */}
            {step === 2 && (() => {
              const mUrl = `${window.location.protocol}//${window.location.host}/mobile${user?.uid?`?room=${encodeURIComponent(user.uid)}`:''}`;
              return (
                <div style={{background:S.sky,border:`1.5px solid ${S.carbon}`,borderRadius:8,padding:'10px 14px',display:'flex',alignItems:'center',gap:10,marginTop:4}}>
                  <code style={{fontFamily:S.f.mono,fontSize:11,color:S.carbon,flex:1,wordBreak:'break-all',lineHeight:1.5}}>{mUrl}</code>
                  <button onClick={()=>navigator.clipboard?.writeText(mUrl)}
                    style={{fontFamily:S.f.mono,fontSize:9,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',
                      color:S.carbon,background:S.paper,border:`1.5px solid ${S.carbon}`,borderRadius:6,
                      padding:'5px 10px',cursor:'pointer',flexShrink:0,whiteSpace:'nowrap'}}>
                    Copy
                  </button>
                </div>
              );
            })()}
            {/* step progress bars */}
            <div style={{ display:'flex',gap:6 }}>
              {STEPS.map((_,i) => (
                <div key={i} onClick={() => setStep(i)}
                  style={{ height:7,borderRadius:9999,background:i===step?S.carbon:S.gray,border:`1.5px solid ${S.carbon}`,cursor:'pointer',transition:'flex .3s',flex:i===step?3:1 }}/>
              ))}
            </div>
            <div style={{ display:'flex',gap:10 }}>
              {step > 0 && <button onClick={() => setStep(s=>s-1)} style={{ flex:1,padding:'13px 0',borderRadius:9999,border:`2px solid ${S.carbon}`,background:S.paper,fontFamily:S.f.ui,fontWeight:700,fontSize:13,color:S.carbon,cursor:'pointer' }}>Back</button>}
              <button onClick={() => step < STEPS.length-1 ? setStep(s=>s+1) : onClose()}
                style={{ flex:2,padding:'13px 0',borderRadius:9999,border:`2px solid ${S.carbon}`,background:S.carbon,fontFamily:S.f.ui,fontWeight:700,fontSize:13,color:S.paper,cursor:'pointer',boxShadow:`3px 3px 0 ${cur.color}` }}>
                {step < STEPS.length-1 ? 'Next' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════ */
export default function MarketingPage({ onEnter, user, onLogout }) {
  const isAuth = !!user;
  const [pillVisible,  setPillVisible]  = useState(false);
  const [camUrl,       setCamUrl]       = useState('');
  const [pos,          setPos]          = useState(null);
  const [zoomed,       setZoomed]       = useState(false);
  const [panel,        setPanel]        = useState(null);
  const [activeSection,setActiveSection]= useState('');
  const [monitorReady, setMonitorReady] = useState(false); /* fires when monitor faces user */
  const [locHistory,   setLocHistory]   = useState([]);
  const [activeProfile,setActiveProfile]= useState(null);   // selected card
  const [displayName,  setDisplayName]  = useState('');
  const [editingName,  setEditingName]  = useState(false);
  const tableRef = useRef(null), monRef = useRef(null), scrollHintRef = useRef(null), heroRef = useRef(null);
  const animDone = useRef(false), animRaf = useRef(0), wsRef = useRef(null);
  const lastPos  = useRef(null);
  const frontH = 120;

  /* init name from user */
  useEffect(() => {
    if (user && !displayName)
      setDisplayName(user.displayName || user.email?.split('@')[0] || 'Guardian');
  }, [user]);

  /* reverse geocode via Overpass + Nominatim fallback */
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const q = `[out:json][timeout:8];(node(around:120,${lat},${lng})[name][amenity];node(around:120,${lat},${lng})[name][shop];node(around:120,${lat},${lng})[name][building];way(around:120,${lat},${lng})[name][amenity];way(around:120,${lat},${lng})[name][building];);out center 3;`;
      const r1 = await fetch('https://overpass-api.de/api/interpreter',{method:'POST',body:q,headers:{'Content-Type':'text/plain'}});
      const d1 = await r1.json();
      if (d1.elements?.length) return d1.elements[0].tags?.name || 'Nearby place';
    } catch {}
    try {
      const r2 = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const d2 = await r2.json();
      return d2.display_name?.split(',').slice(0,3).join(', ') || 'Unknown area';
    } catch { return 'Unknown area'; }
  }, []);

  const applyP = (p) => {
    const sc = 0.55 + p * 0.4;
    const tY = 600 * (1 - p), mY = 600 * (1 - p) - frontH;
    if (tableRef.current) tableRef.current.style.transform = `translateX(-50%) translateY(${tY}px) scale(${sc})`;
    if (monRef.current)   monRef.current.style.transform   = `translateX(-50%) translateY(${mY}px) scale(${sc})`;
    if (scrollHintRef.current) { const s = scrollHintRef.current.querySelector('span'); if (s) s.textContent = p >= 1 ? 'explore' : 'scroll'; }
  };

  /* GPS WebSocket — auth only */
  useEffect(() => {
    if (!isAuth) return;
    const roomId = user?.uid || 'default';
    let alive = true, ms = 3000;
    const connect = () => {
      try {
        const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const host  = window.location.hostname;
        const wsUrl = proto === 'wss'
          ? `wss://${host}`
          : `ws://${host}:3000`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onopen = () => {
          /* ── JOIN this user's room so only their GPS comes through ── */
          ws.send(JSON.stringify({ type: 'join', roomId }));
        };
        ws.onclose = () => { if (alive) setTimeout(connect, ms); ms = Math.min(ms * 1.5, 30000); };
        ws.onerror = () => ws.close();
        ws.onmessage = async (e) => {
          try {
            const d = JSON.parse(e.data);
            const lat = d.latitude ?? d.lat;
            const lng = d.longitude ?? d.lng;
            if (lat && lng) {
              const p = [lat, lng];
              setPos(p);
              const last = lastPos.current;
              const dist = last ? Math.sqrt((p[0]-last[0])**2+(p[1]-last[1])**2)*111000 : 999;
              const now = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false});
              if (dist > 30) {
                lastPos.current = p;
                setLocHistory(h => {
                  const entry = { arrived:now, lastSeen:now, landmark:null, loading:true, lat:p[0], lng:p[1] };
                  const next = [...h, entry];
                  reverseGeocode(p[0],p[1]).then(name => {
                    setLocHistory(hh => hh.map((x,i) => i===next.length-1?{...x,landmark:name,loading:false}:x));
                  });
                  return next;
                });
              } else {
                setLocHistory(h => h.length ? h.map((x,i)=>i===h.length-1?{...x,lastSeen:now}:x) : h);
              }
            }
          } catch {}
        };
      } catch {}
    };
    connect();
    return () => { alive = false; wsRef.current?.close(); };
  }, [isAuth]);

  /* Scroll / animation */
  useEffect(() => {
    if (isAuth) {
      /* apply final position first, then play spring via wrapper animation */
      applyP(1);
      if (monRef.current) {
        monRef.current.style.animation = 'monitor-spring .9s cubic-bezier(.22,1,.36,1) both';
      }
      if (tableRef.current) {
        tableRef.current.style.animation = 'monitor-spring .9s cubic-bezier(.22,1,.36,1) both';
        tableRef.current.style.animationDelay = '0.05s';
      }
      animDone.current = true;
      setMonitorReady(true);
      const onScroll = () => { const show = window.scrollY > 80 && window.scrollY < window.innerHeight * 3.5; setPillVisible(p => p !== show ? show : p); };
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }
    applyP(0);
    const DURATION = 1800;
    const onScroll = () => { if (!animDone.current) return; const show = window.scrollY > 80 && window.scrollY < window.innerHeight * 3.5; setPillVisible(p => p !== show ? show : p); };
    const runAnim = () => {
      const savedY = window.scrollY;
      document.body.style.cssText += 'overflow:hidden;position:fixed;top:-' + savedY + 'px;width:100%';
      const start = performance.now();
      const frame = (now) => {
        const p = Math.min(1, 1 - Math.pow(1 - (now - start) / DURATION, 3));
        applyP(p);
        if (p < 1) { animRaf.current = requestAnimationFrame(frame); }
        else { document.body.style.overflow = document.body.style.position = document.body.style.top = document.body.style.width = ''; window.scrollTo(0, savedY); animDone.current = true; setMonitorReady(true); setPillVisible(true); window.addEventListener('scroll', onScroll, { passive: true }); }
      };
      animRaf.current = requestAnimationFrame(frame);
    };
    const onFirst = () => { if (animDone.current) return; window.removeEventListener('wheel', onFirst); window.removeEventListener('touchmove', onFirst); window.removeEventListener('keydown', onFirst); runAnim(); };
    window.addEventListener('wheel', onFirst, { passive: true });
    window.addEventListener('touchmove', onFirst, { passive: true });
    window.addEventListener('keydown', onFirst);
    return () => { cancelAnimationFrame(animRaf.current); window.removeEventListener('wheel', onFirst); window.removeEventListener('touchmove', onFirst); window.removeEventListener('keydown', onFirst); window.removeEventListener('scroll', onScroll); document.body.style.overflow = document.body.style.position = document.body.style.top = document.body.style.width = ''; };
  }, [isAuth]);

  /* ── Continuous SIGMAVISION letter float (non-auth) ── */
  useEffect(() => {
    if (isAuth) return;
    const t = setTimeout(() => {
      const sigmaEl = heroRef.current?.querySelector('.sigma-title');
      if (!sigmaEl) return;
      const sp = new SplitText(sigmaEl, { type: 'chars' });
      const ctx = gsap.context(() => {
        sp.chars.forEach((char, i) => {
          gsap.to(char, {
            y: gsap.utils.random(-10, 10),
            rotation: gsap.utils.random(-3, 3),
            duration: gsap.utils.random(2.5, 4.5),
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: i * 0.09,
          });
        });
      }, sigmaEl);
      return () => { ctx.revert(); sp.revert(); };
    }, 2400);
    return () => clearTimeout(t);
  }, [isAuth]);

  const handleLogout = async () => { try { await signOut(auth); } catch {} onLogout(); };

  /* ── Active section observer for nav indicator ── */
  useEffect(() => {
    if (isAuth) return;
    const ids = ['sv-about','sv-services','sv-work','sv-faq'];
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [isAuth]);

  return (
    <div style={{ background: S.sky, fontFamily: S.f.ui }}>
      <style>{ANIM_CSS}</style>
      <Marquee />

      {/* NAV */}
      <nav style={{ position:'sticky', top:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px clamp(20px,4vw,64px)', background:isAuth?S.carbon:S.sky, borderBottom:`1px solid ${isAuth?'rgba(255,255,255,0.1)':S.carbon}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:34, height:34, borderRadius:9999, border:`1.5px solid ${isAuth?'rgba(255,255,255,0.25)':S.carbon}`, background:isAuth?'rgba(255,255,255,0.08)':S.paper, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontFamily:S.f.disp, fontWeight:900, fontSize:17, color:isAuth?S.paper:S.carbon }}>S</span>
          </div>
          <span style={{ fontFamily:S.f.ui, fontWeight:700, fontSize:15, color:isAuth?S.paper:S.carbon, letterSpacing:'-0.01em' }}>SigmaVision</span>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {isAuth ? (
            <>
              <PillNavDark onClick={() => setPanel(p => p === 'setup' ? null : 'setup')}>Setup</PillNavDark>
              <PillNavDark onClick={() => setPanel(p => p === 'tutorial' ? null : 'tutorial')}>Tutorial</PillNavDark>
              <PillNavDark onClick={() => setPanel(p => p === 'profile' ? null : 'profile')}>Profile</PillNavDark>
            </>
          ) : (
            [['About','sv-about'],['Features','sv-services'],['System','sv-work'],['FAQ','sv-faq']].map(([l,id]) => (
              <PillNav key={id} onClick={() => document.getElementById(id)?.scrollIntoView({ behavior:'smooth' })} active={activeSection===id}>{l}</PillNav>
            ))
          )}
        </div>
        {isAuth
          ? <CtaBtnDark onClick={handleLogout}>Sign Out</CtaBtnDark>
          : <CtaBtn onClick={onEnter}>Launch App</CtaBtn>
        }
      </nav>

      {/* FLOATING SIGMA CARD — only on marketing page, not when logged in */}
      {!isAuth && <div style={{ position:'fixed', right:'clamp(14px,2vw,32px)', bottom:'clamp(60px,10vh,100px)', zIndex:50, width:220, transform:`translateX(${pillVisible?'0px':'280px'})`, opacity:pillVisible?1:0, transition:'transform .55s cubic-bezier(.22,1,.36,1),opacity .4s ease', pointerEvents:pillVisible?'auto':'none' }}>
        <div style={{ background:S.paper, border:`2.5px solid ${S.carbon}`, borderRadius:22, overflow:'hidden', boxShadow:`5px 6px 0 ${S.carbon}` }}>
          <div style={{ background:S.mint, borderBottom:`2.5px solid ${S.carbon}`, padding:'10px 14px 8px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontFamily:S.f.disp, fontWeight:900, fontSize:22, letterSpacing:'-0.01em', textTransform:'uppercase', color:S.carbon, lineHeight:1 }}>S.I.G.M.A</span>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:S.ember, border:`1.5px solid ${S.carbon}`, animation:'sigma-dot 1.4s ease-in-out infinite' }}/>
              <span style={{ fontFamily:S.f.mono, fontSize:9, fontWeight:700, letterSpacing:'0.1em', color:S.carbon, opacity:.6 }}>LIVE</span>
            </div>
          </div>
          <div style={{ padding:'12px 14px 14px' }}>
            <p style={{ fontFamily:S.f.ui, fontSize:12, fontWeight:600, lineHeight:1.6, color:S.carbon, opacity:.75, margin:'0 0 12px' }}>The person walks. You watch. Camera, GPS, and obstacle sensors — all in one tab.</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {[['Camera',S.lavender],['Location',S.sun],['Alerts',S.ember]].map(([l,c])=>(
                <span key={l} style={{ fontFamily:S.f.ui, fontWeight:700, fontSize:9, letterSpacing:'0.06em', textTransform:'uppercase', background:c, color:S.carbon, border:`1.5px solid ${S.carbon}`, borderRadius:9999, padding:'3px 8px' }}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </div>}

      {/* ══ HERO ══ */}
      <section ref={heroRef} style={{ position:'relative', height:'100vh', background:isAuth?S.carbon:S.sky, isolation:'isolate', overflow:'hidden' }}>
        <DashboardAnimator heroRef={heroRef} isAuth={isAuth}/>
        {!isAuth && <Ribbon style={{ top:'-2%', height:'clamp(180px,22vw,300px)', zIndex:1 }}/>}
        {!isAuth && <Ribbon flip style={{ bottom:'-2%', height:'clamp(160px,20vw,280px)', zIndex:1, opacity:.6 }}/>}

        {!isAuth && <FloatSticker src="/sticker-camera.png"   alt="" size={140} animName="cam-float"     animDur="5.2s" rotate={-10} style={{ position:'absolute', top:'10%',    left:'2%',  zIndex:5 }}/>}
        {!isAuth && <FloatSticker src="/sticker-map.png"      alt="" size={130} animName="map-sway"      animDur="4.8s" rotate={6}   style={{ position:'absolute', bottom:'20%', left:'3%',  zIndex:5 }}/>}
        {!isAuth && <FloatSticker src="/sticker-verified.png" alt="" size={115} animName="badge-spin"    animDur="3.6s" rotate={12}  style={{ position:'absolute', top:'12%',    right:'2%', zIndex:5 }}/>}
        {!isAuth && <FloatSticker src="/sticker-rocket.png"   alt="" size={125} animName="rocket-launch" animDur="4.0s" rotate={-15} style={{ position:'absolute', bottom:'10%', right:'3%', zIndex:5 }}/>}

        {/* hero text — full size always */}
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', paddingTop: isAuth ? 'clamp(14px,2vh,24px)' : 'clamp(52px,8vh,88px)', zIndex:2, pointerEvents:'none', userSelect:'none', textAlign:'center' }}>
          <BlurText text="SIGMAVISION" animateBy="letters" delay={50} direction="top" stepDuration={0.34}
            className="sigma-title"
            style={{ fontFamily:S.f.disp, fontWeight:900, fontSize:'clamp(80px,16vw,220px)', lineHeight:0.8, letterSpacing:'0.01em', textTransform:'uppercase', color:isAuth?S.paper:S.carbon, justifyContent:'center', whiteSpace:'nowrap' }}/>

          {/* ── AUTH VIEW — status badges + welcome ── */}
          {isAuth && (
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.4,duration:.55,ease:[.22,1,.36,1]}}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, marginTop:20, pointerEvents:'auto' }}>
              {/* welcome line */}
              <p className="dash-label" style={{ fontFamily:S.f.mono, fontWeight:700, fontSize:11, color:S.paper, opacity:.4, letterSpacing:'0.16em', textTransform:'uppercase', margin:0 }}>
                Dashboard live
              </p>
              {/* live status pills — bigger on dark bg */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
                <span className="status-pill-wrap"><StatusPill label="Camera" active={!!camUrl} color={S.blue}/></span>
                <span className="status-pill-wrap"><StatusPill label="GPS"    active={!!pos}    color={S.mint}/></span>
                <span className="status-pill-wrap"><StatusPill label="System" active             color={S.lavender}/></span>
              </div>
              {/* quick actions */}
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center', marginTop:4 }}>
                <button className="dash-action-btn" onClick={() => setZoomed(true)}
                  onMouseEnter={e=>e.currentTarget.style.opacity='.8'}
                  onMouseLeave={e=>e.currentTarget.style.opacity='1'}
                  style={{fontFamily:S.f.ui,fontWeight:700,fontSize:13,letterSpacing:'0.032em',textTransform:'uppercase',
                    color:S.carbon,background:S.mint,border:`2px solid ${S.mint}`,borderRadius:9999,
                    padding:'10px 24px',cursor:'pointer',transition:'opacity .15s',
                    boxShadow:`3px 3px 0 rgba(85,219,156,0.35)`}}>
                  Expand Monitor
                </button>
                <button className="dash-action-btn" onClick={() => setPanel('setup')}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.12)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}
                  style={{fontFamily:S.f.ui,fontWeight:700,fontSize:13,letterSpacing:'0.032em',textTransform:'uppercase',
                    color:S.paper,background:'transparent',border:`2px solid rgba(255,255,255,0.25)`,borderRadius:9999,
                    padding:'10px 24px',cursor:'pointer',transition:'background .15s'}}>
                  Camera Setup
                </button>
                <button className="dash-action-btn" onClick={() => setPanel('profile')}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.12)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}
                  style={{fontFamily:S.f.ui,fontWeight:700,fontSize:13,letterSpacing:'0.032em',textTransform:'uppercase',
                    color:S.paper,background:'transparent',border:`2px solid rgba(255,255,255,0.25)`,borderRadius:9999,
                    padding:'10px 24px',cursor:'pointer',transition:'background .15s'}}>
                  Choose Profile
                </button>
              </div>
            </motion.div>
          )}

          {!isAuth && (<>
          <motion.p initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.9,duration:.55,ease:[.22,1,.36,1]}}
            style={{ fontFamily:S.f.ui, fontWeight:500, fontSize:'clamp(15px,1.8vw,22px)', color:S.carbon, opacity:.65, maxWidth:520, margin:'clamp(16px,2vw,24px) auto 0', lineHeight:1.45, letterSpacing:'-0.01em', pointerEvents:'auto' }}>
            A cane with a camera. A phone with GPS. One browser tab.
          </motion.p>
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:1.05,duration:.5}}
            style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', marginTop:'clamp(20px,2.5vw,28px)', pointerEvents:'auto' }}>
            <CtaBtn onClick={onEnter}>Launch App</CtaBtn>
            <CtaBtn outline onClick={() => document.getElementById('sv-about')?.scrollIntoView({ behavior:'smooth' })}>Learn More</CtaBtn>
          </motion.div>
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:1.3,duration:.5}}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, marginTop:'clamp(14px,1.8vw,22px)', pointerEvents:'auto' }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center' }}>
              {[['ESP32-CAM',S.mint],['HC-SR04 Sensors',S.sun],['Phone GPS',S.lavender]].map(([l,c])=><Tag key={l} color={c}>{l}</Tag>)}
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center' }}>
              {[['WebSocket Live',S.blue],['No App Needed',S.ember],['Browser Only',S.mint]].map(([l,c])=><Tag key={l} color={c}>{l}</Tag>)}
            </div>
          </motion.div>
          </>)}
        </div>

        <Monitor tableRef={tableRef} monRef={monRef} isAuth={isAuth} camUrl={camUrl} pos={pos} onZoom={() => setZoomed(true)} activeProfile={activeProfile} monitorReady={monitorReady}/>

        <div ref={scrollHintRef} style={{ position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)', zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
          <div style={{ width:1, height:36, background:'linear-gradient(to bottom,transparent,rgba(0,0,0,0.3))' }}/>
          <span style={{ fontFamily:S.f.mono, fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:S.carbon, opacity:.45 }}>scroll</span>
        </div>
      </section>

      {/* ── zoomed monitor overlay ── */}
      {zoomed && (
        <>
          <div onClick={() => setZoomed(false)} style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.8)' }}/>
          <div style={{
            position:'fixed', top:'50%', left:'50%',
            transform:'translate(-50%,-50%)',
            zIndex:301,
            width:'min(92vw, 1100px)',
            maxHeight:'75vh',
            aspectRatio:'16/9',
            borderRadius:16,
            overflow:'hidden',
            border:`3px solid ${S.carbon}`,
            boxShadow:'0 40px 100px rgba(0,0,0,0.8)',
          }}>
            <MonScreen camUrl={camUrl} pos={pos} activeProfile={activeProfile}/>
            <button onClick={() => setZoomed(false)} aria-label="Close monitor" style={{ position:'absolute', top:14, right:14, width:40, height:40, borderRadius:9999, background:S.carbon, border:`2px solid ${S.paper}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:10 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={S.paper} strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </>
      )}

      {/* ── Setup panel ── */}
      {panel === 'setup' && (
        <>
          <div onClick={() => setPanel(null)} style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.55)' }}/>
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:201, width:'min(94vw,400px)' }}>
            <div style={{ background:S.paper, border:`2.5px solid ${S.carbon}`, borderRadius:12, overflow:'hidden', boxShadow:`7px 8px 0 ${S.carbon}` }}>
              <div style={{ background:S.blue, borderBottom:`2.5px solid ${S.carbon}`, padding:'18px 22px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontFamily:S.f.disp, fontWeight:900, fontSize:36, color:S.carbon, textTransform:'uppercase', lineHeight:.9 }}>CAMERA<br/>SETUP</span>
                <button onClick={() => setPanel(null)} aria-label="Close setup" style={{ width:34, height:34, borderRadius:9999, border:`2px solid ${S.carbon}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={S.carbon} strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <div style={{ padding:'20px 22px' }}>
                <label style={{ fontFamily:S.f.mono, fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:S.carbon, opacity:.5, display:'block', marginBottom:8 }}>ESP32-CAM Stream URL</label>
                <input value={camUrl} onChange={e => setCamUrl(e.target.value)} placeholder="http://192.168.x.x/stream"
                  style={{ width:'100%', padding:'12px 14px', borderRadius:6, border:`2px solid ${S.carbon}`, fontFamily:S.f.mono, fontSize:12, color:S.carbon, background:S.sky, outline:'none', boxSizing:'border-box' }}/>
                <p style={{ fontFamily:S.f.ui, fontSize:11, color:S.carbon, opacity:.45, margin:'8px 0 20px', lineHeight:1.5 }}>Paste your ESP32-CAM streaming URL. Make sure your device is on the same network.</p>
                <button onClick={() => setPanel(null)} style={{ width:'100%', padding:'14px', borderRadius:9999, border:`2px solid ${S.carbon}`, background:S.carbon, fontFamily:S.f.ui, fontWeight:700, fontSize:14, color:S.paper, cursor:'pointer', boxShadow:`3px 3px 0 ${S.blue}` }}>Save</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Tutorial panel ── */}
      {panel === 'tutorial' && <TutorialModal onClose={() => setPanel(null)} user={user}/>}

      {/* ── Profile orbit stack panel ── */}
      {panel === 'profile' && (
        <>
          <div onClick={() => setPanel(null)} style={{ position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.65)' }}/>
          {/* scrollable container — starts at top, full scroll */}
          <div style={{ position:'fixed',inset:0,zIndex:201,overflowY:'auto',padding:'5vh clamp(12px,4vw,40px) 60px' }}>
            {/* header row — centered, single line */}
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28,maxWidth:1060,margin:'0 auto 28px' }}>
              <div style={{ flex:1 }}/>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:S.f.mono,fontSize:10,letterSpacing:'0.14em',textTransform:'uppercase',color:'#fff',opacity:.5,marginBottom:6 }}>SELECT PROFILE</div>
                <div style={{ fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(32px,5vw,52px)',lineHeight:1,textTransform:'uppercase',color:'#fff',whiteSpace:'nowrap' }}>WHO ARE YOU WATCHING?</div>
              </div>
              <div style={{ flex:1, display:'flex', justifyContent:'flex-end' }}>
                <button onClick={() => setPanel(null)} aria-label="Close profile selector" style={{ width:42,height:42,borderRadius:9999,border:`2px solid #fff`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            {/* orbit stack — inside a scroll-visible container */}
            <div style={{ maxWidth:1060,margin:'0 auto',paddingBottom:40 }}>
              <OrbitCardStack onSelect={(item) => { setActiveProfile(item); setPanel(null); }}/>
            </div>
          </div>
        </>
      )}

      {/* ── Profile card below monitor (when a profile is selected & logged in) ── */}
      {isAuth && activeProfile && (
        <div style={{ background:S.sky, borderTop:`4px solid ${activeProfile?.accent||S.carbon}`, padding:'clamp(40px,6vh,72px) clamp(20px,4vw,64px) clamp(48px,7vh,80px)' }}>
          <ProfileCard
            item={activeProfile}
            locHistory={locHistory}
            pos={pos}
            displayName={displayName}
            setDisplayName={setDisplayName}
            editingName={editingName}
            setEditingName={setEditingName}
            onClear={() => setActiveProfile(null)}
          />
        </div>
      )}

      {/* ══ SECTIONS — only shown when not logged in ══ */}
      {!isAuth && (<>

      {/* ══ ABOUT ══ */}
      <section id="sv-about" style={{background:S.paper,borderTop:`1px solid ${S.carbon}`,borderBottom:`1px solid ${S.carbon}`,position:'relative',overflow:'hidden'}}>
        <Ribbon style={{top:0,height:'clamp(160px,20vw,260px)',zIndex:0,opacity:.55}}/>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'clamp(64px,10vh,120px) clamp(24px,5vw,80px)',position:'relative',zIndex:1}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'clamp(40px,6vw,96px)',alignItems:'center'}}>
            <div>
              <h2 style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(68px,11vw,150px)',lineHeight:.8,color:S.carbon,margin:'0 0 28px',textTransform:'uppercase'}}>
                {['THEY','WALK.','YOU','SEE.'].map((line,i)=>(<motion.span key={i} initial={{opacity:0,x:-24}} whileInView={{opacity:1,x:0}} transition={{duration:.48,delay:i*.08,ease:[.22,1,.36,1]}} viewport={{once:true}} style={{display:'block'}}>{line}</motion.span>))}
              </h2>
              <div style={{display:'flex',gap:12,alignItems:'flex-end',flexWrap:'wrap'}}>
                <FloatSticker src="/sticker-map.png" alt="" size={110} animName="map-sway" animDur="5s" rotate={-4}/>
                <FloatSticker src="/sticker-verified.png" alt="" size={90} animName="badge-spin" animDur="4s" rotate={8} style={{alignSelf:'flex-end'}}/>
              </div>
            </div>
            <motion.div initial={{opacity:0,y:32}} whileInView={{opacity:1,y:0}} transition={{duration:.65,ease:[.22,1,.36,1]}} viewport={{once:true}}>
              <p style={{fontFamily:S.f.ui,fontSize:'clamp(16px,1.6vw,21px)',fontWeight:700,lineHeight:1.38,letterSpacing:'-0.01em',color:S.carbon,margin:'0 0 16px'}}>They walk. You see. That's the whole idea.</p>
              <p style={{fontFamily:S.f.ui,fontSize:15,fontWeight:500,lineHeight:1.68,color:S.carbon,opacity:.6,margin:'0 0 32px'}}>SigmaVision puts a live camera feed, a GPS map, and obstacle sensor data into one browser tab. The person using the cane carries the hardware. The caregiver opens the dashboard. No app, no account on their end, nothing to install.</p>
              <CtaBtn onClick={onEnter}>Launch App</CtaBtn>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="sv-services" style={{background:S.carbon,borderBottom:`1px solid rgba(255,255,255,0.08)`}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>

          {/* header */}
          <div style={{padding:'clamp(48px,7vh,80px) clamp(24px,5vw,80px) 0',marginBottom:'clamp(32px,5vh,52px)'}}>
            <h2 style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(56px,9vw,124px)',lineHeight:.84,color:S.paper,margin:0,textTransform:'uppercase',letterSpacing:'-0.01em'}}>THREE<br/>THINGS IT DOES.</h2>
          </div>

          {/* row 01 — Camera */}
          <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} transition={{duration:.55,ease:[.22,1,.36,1]}} viewport={{once:true}}
            style={{display:'grid',gridTemplateColumns:'minmax(0,5fr) minmax(0,7fr)',borderTop:`1px solid rgba(255,255,255,0.12)`}}>
            <div style={{background:S.lavender,padding:'clamp(32px,5vw,64px) clamp(24px,4vw,56px)',display:'flex',flexDirection:'column',justifyContent:'space-between',gap:24,borderRight:`1px solid ${S.carbon}`}}>
              <span style={{fontFamily:S.f.mono,fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:S.carbon,opacity:.5}}>01 — Camera</span>
              <div style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(64px,10vw,140px)',lineHeight:.82,color:S.carbon,letterSpacing:'-0.02em'}}>LIVE<br/>FEED.</div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:S.carbon,opacity:.35}}/>
                <span style={{fontFamily:S.f.mono,fontSize:10,letterSpacing:'0.12em',color:S.carbon,opacity:.45,textTransform:'uppercase'}}>Wi-Fi · Streams live</span>
              </div>
            </div>
            <div style={{padding:'clamp(32px,5vw,64px) clamp(24px,4vw,56px)',display:'flex',flexDirection:'column',justifyContent:'center',gap:20}}>
              <h3 style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(28px,3.5vw,52px)',lineHeight:.92,textTransform:'uppercase',color:S.paper,margin:0,letterSpacing:'-0.01em'}}>See what they see, as it happens.</h3>
              <p style={{fontFamily:S.f.ui,fontSize:'clamp(14px,1.2vw,17px)',fontWeight:500,lineHeight:1.72,color:S.paper,opacity:.58,margin:0,maxWidth:480}}>
                The cane has a camera. It connects to your Wi-Fi and streams to your browser tab. You paste its address into Setup once. You never touch it again — the feed is just there every time you open the dashboard.
              </p>
            </div>
          </motion.div>

          {/* row 02 — Location */}
          <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} transition={{duration:.55,delay:.08,ease:[.22,1,.36,1]}} viewport={{once:true}}
            style={{display:'grid',gridTemplateColumns:'minmax(0,7fr) minmax(0,5fr)',borderTop:`1px solid rgba(255,255,255,0.12)`}}>
            <div style={{padding:'clamp(32px,5vw,64px) clamp(24px,4vw,56px)',display:'flex',flexDirection:'column',justifyContent:'center',gap:20,borderRight:`1px solid rgba(255,255,255,0.12)`}}>
              <h3 style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(28px,3.5vw,52px)',lineHeight:.92,textTransform:'uppercase',color:S.paper,margin:0,letterSpacing:'-0.01em'}}>Know exactly where they are.</h3>
              <p style={{fontFamily:S.f.ui,fontSize:'clamp(14px,1.2vw,17px)',fontWeight:500,lineHeight:1.72,color:S.paper,opacity:.58,margin:0,maxWidth:480}}>
                The person opens a URL on their phone and taps one button. Their GPS pushes to your map straight away and keeps updating as they move. You see every stop, every route change, in order.
              </p>
            </div>
            <div style={{background:S.mint,padding:'clamp(32px,5vw,64px) clamp(24px,4vw,56px)',display:'flex',flexDirection:'column',justifyContent:'space-between',gap:24}}>
              <span style={{fontFamily:S.f.mono,fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:S.carbon,opacity:.5}}>02 — Location</span>
              <div style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(64px,10vw,140px)',lineHeight:.82,color:S.carbon,letterSpacing:'-0.02em'}}>GPS<br/>MAP.</div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:S.carbon,opacity:.35}}/>
                <span style={{fontFamily:S.f.mono,fontSize:10,letterSpacing:'0.12em',color:S.carbon,opacity:.45,textTransform:'uppercase'}}>Phone · Updates live</span>
              </div>
            </div>
          </motion.div>

          {/* row 03 — Obstacle */}
          <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} transition={{duration:.55,delay:.16,ease:[.22,1,.36,1]}} viewport={{once:true}}
            style={{display:'grid',gridTemplateColumns:'minmax(0,5fr) minmax(0,7fr)',borderTop:`1px solid rgba(255,255,255,0.12)`}}>
            <div style={{background:S.sun,padding:'clamp(32px,5vw,64px) clamp(24px,4vw,56px)',display:'flex',flexDirection:'column',justifyContent:'space-between',gap:24,borderRight:`1px solid ${S.carbon}`}}>
              <span style={{fontFamily:S.f.mono,fontSize:10,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:S.carbon,opacity:.5}}>03 — Obstacle</span>
              <div style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(64px,10vw,140px)',lineHeight:.82,color:S.carbon,letterSpacing:'-0.02em'}}>SENSE.<br/>WARN.</div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:S.carbon,opacity:.35}}/>
                <span style={{fontFamily:S.f.mono,fontSize:10,letterSpacing:'0.12em',color:S.carbon,opacity:.45,textTransform:'uppercase'}}>Sensors · Vibration</span>
              </div>
            </div>
            <div style={{padding:'clamp(32px,5vw,64px) clamp(24px,4vw,56px)',display:'flex',flexDirection:'column',justifyContent:'center',gap:20}}>
              <h3 style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(28px,3.5vw,52px)',lineHeight:.92,textTransform:'uppercase',color:S.paper,margin:0,letterSpacing:'-0.01em'}}>Warned before they reach it.</h3>
              <p style={{fontFamily:S.f.ui,fontSize:'clamp(14px,1.2vw,17px)',fontWeight:500,lineHeight:1.72,color:S.paper,opacity:.58,margin:0,maxWidth:480}}>
                Two sensors on the cane measure what's ahead. The moment something enters the danger range, the cane buzzes and vibrates — the person knows before they take another step. Nothing to carry, nothing to press.
              </p>
            </div>
          </motion.div>

          {/* bottom bar */}
          <div style={{borderTop:`1px solid rgba(255,255,255,0.1)`,padding:'clamp(20px,3vh,36px) clamp(24px,5vw,80px)',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
            <span style={{fontFamily:S.f.mono,fontSize:10,letterSpacing:'0.16em',textTransform:'uppercase',color:S.paper,opacity:.25}}>S.I.G.M.A — Naga City Science High School</span>
            <CtaBtn onClick={onEnter}>Launch App</CtaBtn>
          </div>

        </div>
      </section>

      {/* ══ SYSTEM ══ */}
      <section id="sv-work" style={{background:S.paper,borderBottom:`1px solid ${S.carbon}`}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'clamp(64px,10vh,120px) clamp(24px,5vw,80px)'}}>

          {/* header row */}
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:'clamp(48px,7vh,80px)',flexWrap:'wrap',gap:24}}>
            <h2 style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(52px,8.5vw,116px)',lineHeight:.82,color:S.carbon,margin:0,textTransform:'uppercase'}}>HOW THE<br/>CANE WORKS.</h2>
            <div style={{display:'flex',gap:12,alignItems:'flex-end',flexWrap:'wrap'}}>
              <FloatSticker src="/sticker-rocket.png" alt="" size={100} animName="rocket-launch" animDur="4.2s" rotate={-12} style={{alignSelf:'center'}}/>
              <FloatSticker src="/sticker-camera.png" alt="" size={90} animName="cam-float" animDur="5.4s" rotate={8} style={{alignSelf:'flex-end'}}/>
            </div>
          </div>

          {/* three numbered panels — full-width, no equal columns, no icons */}
          <div style={{display:'flex',flexDirection:'column',gap:0}}>

            {/* 01 */}
            <motion.div initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} transition={{duration:.5,ease:[.22,1,.36,1]}} viewport={{once:true}}
              style={{display:'grid',gridTemplateColumns:'clamp(64px,8vw,120px) minmax(0,1fr) minmax(0,1fr)',gap:'clamp(20px,3vw,48px)',alignItems:'start',padding:'clamp(28px,4vh,44px) 0',borderTop:`2px solid ${S.carbon}`}}>
              <div style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(52px,7vw,96px)',lineHeight:.85,color:S.carbon,opacity:.12,letterSpacing:'-0.02em',userSelect:'none'}}>01</div>
              <div>
                <div style={{fontFamily:S.f.mono,fontSize:10,fontWeight:700,letterSpacing:'0.16em',textTransform:'uppercase',color:S.carbon,opacity:.4,marginBottom:12}}>The Camera</div>
                <h3 style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(28px,4vw,54px)',lineHeight:.9,textTransform:'uppercase',color:S.carbon,margin:0,letterSpacing:'-0.01em'}}>You see the path<br/>as they walk it.</h3>
              </div>
              <p style={{fontFamily:S.f.ui,fontSize:'clamp(14px,1.2vw,17px)',fontWeight:500,lineHeight:1.72,color:S.carbon,opacity:.58,margin:0,paddingTop:'clamp(28px,3.5vh,42px)'}}>
                A small camera bolted to the cane connects to Wi-Fi and streams directly to your browser. Paste its address into Setup once. That's it — every time you open the dashboard the feed is waiting.
              </p>
            </motion.div>

            {/* 02 */}
            <motion.div initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} transition={{duration:.5,delay:.1,ease:[.22,1,.36,1]}} viewport={{once:true}}
              style={{display:'grid',gridTemplateColumns:'clamp(64px,8vw,120px) minmax(0,1fr) minmax(0,1fr)',gap:'clamp(20px,3vw,48px)',alignItems:'start',padding:'clamp(28px,4vh,44px) 0',borderTop:`2px solid ${S.carbon}`,background:S.sky,margin:'0 clamp(-24px,-5vw,-80px)',padding:`clamp(28px,4vh,44px) clamp(24px,5vw,80px)`}}>
              <div style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(52px,7vw,96px)',lineHeight:.85,color:S.carbon,opacity:.12,letterSpacing:'-0.02em',userSelect:'none'}}>02</div>
              <div>
                <div style={{fontFamily:S.f.mono,fontSize:10,fontWeight:700,letterSpacing:'0.16em',textTransform:'uppercase',color:S.carbon,opacity:.4,marginBottom:12}}>The Phone</div>
                <h3 style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(28px,4vw,54px)',lineHeight:.9,textTransform:'uppercase',color:S.carbon,margin:0,letterSpacing:'-0.01em'}}>One tap.<br/>Location starts.</h3>
              </div>
              <p style={{fontFamily:S.f.ui,fontSize:'clamp(14px,1.2vw,17px)',fontWeight:500,lineHeight:1.72,color:S.carbon,opacity:.58,margin:0,paddingTop:'clamp(28px,3.5vh,42px)'}}>
                The person carrying the cane opens a tracking page on their phone and taps Start. Their coordinates push to your dashboard over WebSocket. You watch the dot move. No account needed on their end.
              </p>
            </motion.div>

            {/* 03 */}
            <motion.div initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} transition={{duration:.5,delay:.2,ease:[.22,1,.36,1]}} viewport={{once:true}}
              style={{display:'grid',gridTemplateColumns:'clamp(64px,8vw,120px) minmax(0,1fr) minmax(0,1fr)',gap:'clamp(20px,3vw,48px)',alignItems:'start',padding:'clamp(28px,4vh,44px) 0',borderTop:`2px solid ${S.carbon}`,borderBottom:`2px solid ${S.carbon}`}}>
              <div style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(52px,7vw,96px)',lineHeight:.85,color:S.carbon,opacity:.12,letterSpacing:'-0.02em',userSelect:'none'}}>03</div>
              <div>
                <div style={{fontFamily:S.f.mono,fontSize:10,fontWeight:700,letterSpacing:'0.16em',textTransform:'uppercase',color:S.carbon,opacity:.4,marginBottom:12}}>The Sensors</div>
                <h3 style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(28px,4vw,54px)',lineHeight:.9,textTransform:'uppercase',color:S.carbon,margin:0,letterSpacing:'-0.01em'}}>Feels it before<br/>reaching it.</h3>
              </div>
              <p style={{fontFamily:S.f.ui,fontSize:'clamp(14px,1.2vw,17px)',fontWeight:500,lineHeight:1.72,color:S.carbon,opacity:.58,margin:0,paddingTop:'clamp(28px,3.5vh,42px)'}}>
                Two ultrasonic sensors on the cane read the distance to whatever is ahead. Cross the threshold — the cane buzzes and vibrates immediately. The person reacts before they make contact. The dashboard shows the sensor state in real time.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section id="sv-faq" style={{background:S.sky,borderBottom:`1px solid ${S.carbon}`}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'clamp(64px,10vh,120px) clamp(24px,5vw,80px)'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:'clamp(36px,6vw,96px)',alignItems:'start'}}>
            <div style={{position:'sticky',top:80}}>
              <Sticker color={S.violet} icon="check" rotate={-10} size={52} style={{marginBottom:18}}/>
              <h2 style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(52px,7vw,96px)',lineHeight:.82,color:S.carbon,margin:'0 0 14px',textTransform:'uppercase'}}>QUESTIONS<br/>ANSWERED.</h2>
              <p style={{fontFamily:S.f.ui,fontSize:14,fontWeight:500,lineHeight:1.65,color:S.carbon,opacity:.5,margin:0}}>How the hardware works. What the dashboard does. Who built it.</p>
            </div>
            <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} transition={{duration:.65,ease:[.22,1,.36,1]}} viewport={{once:true}}>
              <MotionFAQ/>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section style={{background:S.carbon,borderBottom:`1px solid rgba(255,255,255,0.08)`}}>
        <div style={{maxWidth:900,margin:'0 auto',padding:'clamp(80px,12vh,140px) clamp(24px,5vw,80px)',textAlign:'center'}}>
          <motion.div initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}} transition={{duration:.7,ease:[.22,1,.36,1]}} viewport={{once:true}}>
            <h2 style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(68px,12vw,170px)',lineHeight:.78,color:S.paper,margin:'0 0 clamp(20px,3vw,36px)',textTransform:'uppercase'}}>OPEN A<br/>BROWSER.<br/>YOU'RE IN.</h2>
            <p style={{fontFamily:S.f.ui,fontSize:'clamp(15px,1.5vw,19px)',fontWeight:500,lineHeight:1.55,color:S.paper,opacity:.55,maxWidth:480,margin:'0 auto clamp(28px,4vw,44px)',letterSpacing:'-0.01em'}}>Log in. Paste the camera IP. Open the GPS page on their phone. Everything shows up in the dashboard immediately — no config, no waiting.</p>
            <CtaBtn onClick={onEnter}>Launch App</CtaBtn>
          </motion.div>
        </div>
      </section>

      {/* ══ CROWD CANVAS ══ */}
      <section style={{
        position   : 'relative',
        height     : 'clamp(480px,60vh,680px)',
        overflow   : 'hidden',
        background : S.sky,
        borderTop  : `2px solid ${S.carbon}`,
      }}>
        <CrowdCanvas count={34} />
      </section>

      {/* ══ close not-auth sections ══ */}
      </>)}

      {/* ══ FOOTER ══ */}
      <footer style={{background:S.carbon,padding:'clamp(16px,2vw,28px) clamp(24px,5vw,80px)',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12,borderTop:'1px solid rgba(255,255,255,0.08)'}}>
        <button onClick={isAuth ? handleLogout : onEnter}
          onMouseEnter={e=>e.currentTarget.style.opacity='.75'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}
          style={{fontFamily:S.f.ui,fontWeight:700,fontSize:14,color:S.carbon,background:S.paper,border:`1px solid ${S.paper}`,borderRadius:9999,padding:'10px 28px',cursor:'pointer',transition:'opacity .18s',letterSpacing:'0.032em'}}>
          {isAuth ? 'Sign Out' : 'Launch App'}
        </button>
        <div style={{display:'flex',gap:20,alignItems:'center'}}>
          <button onClick={()=>alert('SigmaVision Terms of Service\n\nThis is a research system built at Naga City Science High School. Use it only with the person\'s knowledge and consent. Do not use it for surveillance without permission.')}
            style={{fontFamily:S.f.mono,fontSize:11,color:'rgba(255,255,255,0.4)',background:'none',border:'none',cursor:'pointer',letterSpacing:'0.12em',textTransform:'uppercase'}}>
            Terms
          </button>
          <button onClick={()=>alert('Privacy Policy\n\nSigmaVision does not store video or location data on any server. Camera streams are direct peer connections. GPS coordinates are sent only to the logged-in caregiver\'s session and are not retained after the session ends.')}
            style={{fontFamily:S.f.mono,fontSize:11,color:'rgba(255,255,255,0.4)',background:'none',border:'none',cursor:'pointer',letterSpacing:'0.12em',textTransform:'uppercase'}}>
            Privacy
          </button>
          <span style={{fontFamily:S.f.mono,fontSize:10,color:'rgba(255,255,255,0.2)',letterSpacing:'0.1em'}}>© 2025 SigmaVision · NCSHS</span>
        </div>
      </footer>
    </div>
  );
}
