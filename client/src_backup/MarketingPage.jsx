import { useEffect, useState, useRef, useCallback } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { motion, useReducedMotion } from 'framer-motion';
import { MapContainer, TileLayer, CircleMarker, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MotionFAQ from './components/MotionFAQ';
import BlurText from './components/BlurText';

const S = {
  carbon:'#000000', paper:'#ffffff', sky:'#dceeff', gray:'#cccccc',
  blue:'#4da2ff', mint:'#55db9c', lavender:'#e9ccff',
  ember:'#fb4903', sun:'#ffd731', violet:'#5c4ade',
  f:{
    disp:"'Barlow Condensed','Bebas Neue',Impact,sans-serif",
    ui:"'DM Sans','Inter',ui-sans-serif,sans-serif",
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
        box-shadow:3px 3px 0 #000;
      ">
        ${pfpSrc
          ? `<img src="${pfpSrc}" style="width:100%;height:100%;object-fit:contain;object-position:center top;display:block;"/>`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;color:#000;font-family:Impact,sans-serif">?</div>`
        }
      </div>
      <div style="
        width:10px;height:10px;border-radius:50%;
        background:${accent||'#55db9c'};border:2px solid #000;
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
              <div style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(16px,2.8vw,32px)',color:'#fff',lineHeight:.85,textTransform:'uppercase',letterSpacing:'-0.01em'}}>NO<br/>SIGNAL</div>
              <div style={{fontFamily:S.f.ui,fontSize:'clamp(7px,1vw,10px)',fontWeight:600,color:'rgba(255,255,255,0.55)',marginTop:4,lineHeight:1.4}}>Set ESP32-CAM URL<br/>in Setup</div>
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
              <div style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(16px,2.8vw,32px)',color:S.carbon,lineHeight:.85,textTransform:'uppercase',letterSpacing:'-0.01em'}}>AWAITING<br/>GPS</div>
              <div style={{fontFamily:S.f.ui,fontSize:'clamp(7px,1vw,10px)',fontWeight:600,color:'rgba(0,0,0,0.5)',marginTop:4,lineHeight:1.4}}>Connect IoT device<br/>to start tracking</div>
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
function Monitor({ tableRef, monRef, isAuth, camUrl, pos, onZoom, activeProfile }) {
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
          /* logged out — dark screen placeholder */
          <div style={{position:'absolute',top:'0.21%',left:'0.16%',right:'0.16%',bottom:'24.47%',background:'#111',borderRadius:2,zIndex:1}}/>
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
const PillNav=({children,onClick})=>(<button onClick={onClick} onMouseEnter={e=>{e.currentTarget.style.background=S.carbon;e.currentTarget.style.color=S.paper;}} onMouseLeave={e=>{e.currentTarget.style.background=S.paper;e.currentTarget.style.color=S.carbon;}} style={{fontFamily:S.f.ui,fontWeight:700,fontSize:13,letterSpacing:'0.032em',textTransform:'uppercase',color:S.carbon,background:S.paper,border:`1px solid ${S.carbon}`,borderRadius:9999,padding:'8px 16px',cursor:'pointer',whiteSpace:'nowrap',transition:'background .18s,color .18s'}}>{children}</button>);
const CtaBtn=({children,onClick,outline})=>(<button onClick={onClick} onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.04)';e.currentTarget.style.opacity='.88';}} onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.opacity='1';}} style={{fontFamily:S.f.ui,fontWeight:700,fontSize:14,letterSpacing:'0.032em',color:outline?S.carbon:S.paper,background:outline?S.paper:S.carbon,border:`1px solid ${S.carbon}`,borderRadius:9999,padding:'12px 28px',cursor:'pointer',transition:'transform .18s,opacity .18s'}}>{children}</button>);
const Tag=({children,color})=>(<span style={{fontFamily:S.f.ui,fontWeight:700,fontSize:12,letterSpacing:'0.032em',textTransform:'uppercase',color:S.carbon,background:color||S.lavender,border:`1px solid ${S.carbon}`,borderRadius:9999,padding:'5px 14px',whiteSpace:'nowrap'}}>{children}</span>);

/* live status pill with pulsing dot */
const StatusPill=({label,active,color})=>(
  <div style={{display:'flex',alignItems:'center',gap:6,background:active?color:S.gray,border:`2px solid ${S.carbon}`,borderRadius:9999,padding:'5px 14px',boxShadow:`2px 2px 0 ${S.carbon}`}}>
    <div style={{width:7,height:7,borderRadius:'50%',background:active?S.carbon:'rgba(0,0,0,0.3)',border:`1.5px solid ${S.carbon}`,animation:active?'sigma-dot 1.4s ease-in-out infinite':'none',flexShrink:0}}/>
    <span style={{fontFamily:S.f.mono,fontWeight:700,fontSize:10,letterSpacing:'0.12em',textTransform:'uppercase',color:S.carbon}}>{label}</span>
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

function Marquee(){const msg='\u00a0\u00a0+\u00a0SMARTCANE SYSTEM\u00a0\u00a0+\u00a0REAL-TIME CAMERA\u00a0\u00a0+\u00a0IOT LOCATION\u00a0\u00a0+\u00a0OBSTACLE DETECTION\u00a0\u00a0+\u00a0EMERGENCY ALERTS\u00a0\u00a0+\u00a0SIGMAVISION\u00a0\u00a0';return(<div style={{background:S.carbon,overflow:'hidden'}}><div style={{display:'flex',whiteSpace:'nowrap',animation:'mq 24s linear infinite',width:'max-content',padding:'10px 0'}}>{[0,1,2,3].map(i=><span key={i} style={{fontFamily:S.f.ui,fontWeight:700,fontSize:12,letterSpacing:'0.032em',color:S.paper}}>{msg}</span>)}</div></div>);}

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
          <div key={index} role="listitem"
            onMouseEnter={() => activate(index)}
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
              <div style={{ fontFamily:S.f.mono, fontSize:9, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:S.carbon, opacity:.45 }}>GUARDIAN</div>
              <div style={{ fontFamily:S.f.disp, fontWeight:900, fontSize:24, lineHeight:.95, letterSpacing:'-0.02em', color:S.carbon, marginTop:5, textTransform:'uppercase' }}>{item.name}</div>
              <div style={{ marginTop:10, borderTop:`1px solid rgba(0,0,0,0.1)`, paddingTop:7, fontFamily:S.f.mono, fontSize:9, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:S.carbon, opacity:.4 }}>
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
  const location = latest ? (latest.loading ? 'Resolving location…' : latest.landmark || 'Unknown area') : 'No GPS data yet';
  const since    = latest ? `Since ${latest.arrived}` : '—';
  const lastSeen = latest ? latest.lastSeen : '—';

  return (
    <motion.div initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} transition={{ duration:.6, ease:[.22,1,.36,1] }}
      style={{ maxWidth:640, margin:'0 auto', position:'relative' }}>

      {/* pfp image floating ABOVE the card — peeking out from behind it */}
      {item.image && (
        <div style={{
          position:'absolute', top:-60, left:'50%', transform:'translateX(-50%)',
          width:110, height:110,
          borderRadius:9999,
          overflow:'hidden',
          border:`3px solid ${S.carbon}`,
          background: item.accent,
          boxShadow:`4px 4px 0 ${S.carbon}`,
          zIndex:2,
        }}>
          <img src={item.image} alt={displayName}
            style={{ width:'100%', height:'100%', objectFit:'contain', objectPosition:'center top', display:'block' }}/>
        </div>
      )}

      {/* card body — paddingTop makes room for the overlapping pfp */}
      <div style={{
        background:S.paper, border:`2.5px solid ${S.carbon}`,
        borderRadius:28, overflow:'hidden',
        boxShadow:`6px 8px 0 ${S.carbon}`,
        paddingTop:60,
        position:'relative', zIndex:1,
      }}>
        {/* colored accent band */}
        <div style={{ background: item.accent, borderBottom:`2.5px solid ${S.carbon}`, padding:'14px 24px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            <span style={{ fontFamily:S.f.mono, fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:S.carbon, opacity:.5 }}>SELECTED USER</span>
            {editingName ? (
              <input autoFocus value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={e => e.key==='Enter' && setEditingName(false)}
                style={{ fontFamily:S.f.disp, fontWeight:900, fontSize:28, lineHeight:.9, textTransform:'uppercase', color:S.carbon, background:'transparent', border:'none', borderBottom:`2px solid ${S.carbon}`, outline:'none', minWidth:120 }}/>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontFamily:S.f.disp, fontWeight:900, fontSize:28, lineHeight:.9, textTransform:'uppercase', color:S.carbon }}>{displayName}</span>
                <button onClick={() => setEditingName(true)}
                  style={{ fontFamily:S.f.mono, fontSize:8, letterSpacing:'0.12em', textTransform:'uppercase', color:S.carbon, opacity:.4, background:'none', border:'none', cursor:'pointer', padding:'2px 6px' }}>edit</button>
              </div>
            )}
          </div>
          <button onClick={onClear}
            style={{ width:32,height:32,borderRadius:9999,border:`2px solid ${S.carbon}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={S.carbon} strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* location grid */}
        <div style={{ padding:'20px 24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <LocationTile label="Current Location" value={location}      color={S.mint}/>
          <LocationTile label="Time at Spot"     value={since}         color={S.sun}/>
          <LocationTile label="Last Update"      value={lastSeen}      color={S.lavender}/>
          <LocationTile label="GPS Status"       value={pos?'Tracking':'No signal'} color={pos?S.mint:S.gray}/>
        </div>

        {/* history */}
        {locHistory.length > 0 && (
          <div style={{ borderTop:`1.5px solid rgba(0,0,0,0.08)`, padding:'12px 24px 20px' }}>
            <div style={{ fontFamily:S.f.mono, fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:S.carbon, opacity:.4, marginBottom:10 }}>Location History</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {locHistory.slice().reverse().slice(0,5).map((h,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:i===0?S.sky:'rgba(0,0,0,0.03)', borderRadius:12, border:`1px solid rgba(0,0,0,0.07)` }}>
                  <div style={{ width:7,height:7,borderRadius:'50%',background:i===0?S.mint:S.gray,flexShrink:0 }}/>
                  <span style={{ fontFamily:S.f.ui,fontSize:12,fontWeight:600,color:S.carbon,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{h.loading?'Resolving…':h.landmark||'Unknown area'}</span>
                  <span style={{ fontFamily:S.f.mono,fontSize:9,color:S.carbon,opacity:.4,flexShrink:0 }}>{h.arrived}</span>
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
    <div style={{ background:color, border:`1.5px solid ${S.carbon}`, borderRadius:16, padding:'12px 14px', boxShadow:`3px 3px 0 ${S.carbon}` }}>
      <div style={{ fontFamily:S.f.mono, fontSize:8, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:S.carbon, opacity:.5, marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:S.f.ui, fontSize:13, fontWeight:700, color:S.carbon, lineHeight:1.35, wordBreak:'break-word' }}>{value}</div>
    </div>
  );
}

/* ── Tutorial Modal — 4-step Slush style ── */
function TutorialModal({ onClose }) {
  const [step, setStep] = useState(0);
  const STEPS = [
    { color:S.blue,    title:'POWER ON',  body:'Plug your ESP32-CAM into the smart cane battery pack. The status LED blinks when it is booting up.' },
    { color:S.mint,    title:'JOIN WIFI', body:'Connect the ESP32-CAM to your Wi-Fi network. Copy its IP address and paste it in the Setup panel.' },
    { color:S.sun,     title:'GPS LINK',  body:'Open the SigmaVision companion app and tap Share Location. Your position dot appears on the map.' },
    { color:S.lavender,title:'ALL SET',   body:'Camera feed on the left, live GPS on the right. Click the monitor screen to expand to fullscreen.' },
  ];
  const cur = STEPS[step];
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(12px)' }}/>
      <div style={{ position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:201,width:'min(94vw,380px)' }}>
        <div style={{ background:S.paper,border:`2.5px solid ${S.carbon}`,borderRadius:28,overflow:'hidden',boxShadow:`7px 8px 0 ${S.carbon}` }}>
          <div style={{ background:cur.color,borderBottom:`2.5px solid ${S.carbon}`,padding:'20px 24px 16px',display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
            <div>
              <div style={{ fontFamily:S.f.mono,fontSize:10,letterSpacing:'0.14em',color:S.carbon,opacity:.55,marginBottom:6 }}>STEP {step+1} / {STEPS.length}</div>
              <div style={{ fontFamily:S.f.disp,fontWeight:900,fontSize:46,lineHeight:.88,textTransform:'uppercase',color:S.carbon }}>{cur.title}</div>
            </div>
            <button onClick={onClose} style={{ width:34,height:34,borderRadius:9999,border:`2px solid ${S.carbon}`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={S.carbon} strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div style={{ padding:'26px 24px 24px',display:'flex',flexDirection:'column',gap:20 }}>
            <p style={{ fontFamily:S.f.ui,fontSize:14,fontWeight:500,lineHeight:1.68,color:S.carbon,opacity:.7,margin:0 }}>{cur.body}</p>
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
  const [locHistory,   setLocHistory]   = useState([]);
  const [activeProfile,setActiveProfile]= useState(null);   // selected card
  const [displayName,  setDisplayName]  = useState('');
  const [editingName,  setEditingName]  = useState(false);
  const tableRef = useRef(null), monRef = useRef(null), scrollHintRef = useRef(null);
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
    let alive = true, ms = 3000;
    const connect = () => {
      try {
        /* works on localhost AND over ngrok (https → wss, same hostname) */
        const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const host  = window.location.hostname;
        const port  = window.location.port || (proto === 'wss' ? '443' : '3000');
        const wsUrl = proto === 'wss'
          ? `wss://${host}`          // ngrok: no explicit port, same host
          : `ws://${host}:3000`;     // localhost: always 3000
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onclose = () => { if (alive) setTimeout(connect, ms); ms = Math.min(ms * 1.5, 30000); };
        ws.onerror = () => ws.close();
        ws.onmessage = async (e) => {
          try {
            const d = JSON.parse(e.data);
            /* server sends { lat, lng } OR { latitude, longitude } — handle both */
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
        else { document.body.style.overflow = document.body.style.position = document.body.style.top = document.body.style.width = ''; window.scrollTo(0, savedY); animDone.current = true; setPillVisible(true); window.addEventListener('scroll', onScroll, { passive: true }); }
      };
      animRaf.current = requestAnimationFrame(frame);
    };
    const onFirst = () => { if (animDone.current) return; window.removeEventListener('wheel', onFirst); window.removeEventListener('touchmove', onFirst); window.removeEventListener('keydown', onFirst); runAnim(); };
    window.addEventListener('wheel', onFirst, { passive: true });
    window.addEventListener('touchmove', onFirst, { passive: true });
    window.addEventListener('keydown', onFirst);
    return () => { cancelAnimationFrame(animRaf.current); window.removeEventListener('wheel', onFirst); window.removeEventListener('touchmove', onFirst); window.removeEventListener('keydown', onFirst); window.removeEventListener('scroll', onScroll); document.body.style.overflow = document.body.style.position = document.body.style.top = document.body.style.width = ''; };
  }, [isAuth]);

  const handleLogout = async () => { try { await signOut(auth); } catch {} onLogout(); };

  return (
    <div style={{ background: S.sky, fontFamily: S.f.ui }}>
      <style>{ANIM_CSS}</style>
      <Marquee />

      {/* NAV */}
      <nav style={{ position:'sticky', top:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px clamp(20px,4vw,64px)', background:S.sky, borderBottom:`1px solid ${S.carbon}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:34, height:34, borderRadius:9999, border:`1.5px solid ${S.carbon}`, background:S.paper, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontFamily:S.f.disp, fontWeight:900, fontSize:17, color:S.carbon }}>S</span>
          </div>
          <span style={{ fontFamily:S.f.ui, fontWeight:700, fontSize:15, color:S.carbon, letterSpacing:'-0.01em' }}>SigmaVision</span>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          {isAuth ? (
            <>
              <PillNav onClick={() => setPanel(p => p === 'setup' ? null : 'setup')}>Setup</PillNav>
              <PillNav onClick={() => setPanel(p => p === 'tutorial' ? null : 'tutorial')}>Tutorial</PillNav>
              <PillNav onClick={() => setPanel(p => p === 'profile' ? null : 'profile')}>Profile</PillNav>
            </>
          ) : (
            [['About','sv-about'],['Features','sv-services'],['System','sv-work'],['FAQ','sv-faq']].map(([l,id]) => (
              <PillNav key={id} onClick={() => document.getElementById(id)?.scrollIntoView({ behavior:'smooth' })}>{l}</PillNav>
            ))
          )}
        </div>
        {isAuth
          ? <CtaBtn onClick={handleLogout}>Sign Out</CtaBtn>
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
            <p style={{ fontFamily:S.f.ui, fontSize:12, fontWeight:600, lineHeight:1.6, color:S.carbon, opacity:.75, margin:'0 0 12px' }}>Real-time awareness for visually impaired users — IoT location, live camera, emergency alerts.</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {[['Camera',S.lavender],['Location',S.sun],['Alerts',S.ember]].map(([l,c])=>(
                <span key={l} style={{ fontFamily:S.f.ui, fontWeight:700, fontSize:9, letterSpacing:'0.06em', textTransform:'uppercase', background:c, color:S.carbon, border:`1.5px solid ${S.carbon}`, borderRadius:9999, padding:'3px 8px' }}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </div>}

      {/* ══ HERO ══ */}
      <section style={{ position:'relative', height:'100vh', background:S.sky, isolation:'isolate', overflow:'hidden' }}>
        <Ribbon style={{ top:'-2%', height:'clamp(180px,22vw,300px)', zIndex:1 }}/>
        <Ribbon flip style={{ bottom:'-2%', height:'clamp(160px,20vw,280px)', zIndex:1, opacity:.6 }}/>

        <FloatSticker src="/sticker-camera.png"   alt="" size={140} animName="cam-float"     animDur="5.2s" rotate={-10} style={{ position:'absolute', top:'10%',    left:'2%',  zIndex:5 }}/>
        <FloatSticker src="/sticker-map.png"      alt="" size={130} animName="map-sway"      animDur="4.8s" rotate={6}   style={{ position:'absolute', bottom:'20%', left:'3%',  zIndex:5 }}/>
        <FloatSticker src="/sticker-verified.png" alt="" size={115} animName="badge-spin"    animDur="3.6s" rotate={12}  style={{ position:'absolute', top:'12%',    right:'2%', zIndex:5 }}/>
        <FloatSticker src="/sticker-rocket.png"   alt="" size={125} animName="rocket-launch" animDur="4.0s" rotate={-15} style={{ position:'absolute', bottom:'10%', right:'3%', zIndex:5 }}/>

        {/* hero text — full size always */}
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start', paddingTop: isAuth ? 'clamp(14px,2vh,24px)' : 'clamp(52px,8vh,88px)', zIndex:2, pointerEvents:'none', userSelect:'none', textAlign:'center' }}>
          <BlurText text="SIGMAVISION" animateBy="letters" delay={50} direction="top" stepDuration={0.34}
            style={{ fontFamily:S.f.disp, fontWeight:900, fontSize:'clamp(80px,16vw,220px)', lineHeight:0.8, letterSpacing:'0.01em', textTransform:'uppercase', color:S.carbon, justifyContent:'center', whiteSpace:'nowrap' }}/>

          {/* ── AUTH VIEW — status badges + welcome ── */}
          {isAuth && (
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.4,duration:.55,ease:[.22,1,.36,1]}}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, marginTop:14, pointerEvents:'auto' }}>
              {/* welcome line */}
              <p style={{ fontFamily:S.f.ui, fontWeight:600, fontSize:'clamp(13px,1.4vw,17px)', color:S.carbon, opacity:.55, letterSpacing:'-0.01em', margin:0 }}>
                Welcome back — your dashboard is live.
              </p>
              {/* live status pills */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
                <StatusPill label="Camera" active={!!camUrl}   color={S.blue}/>
                <StatusPill label="GPS"    active={!!pos}      color={S.mint}/>
                <StatusPill label="System" active               color={S.lavender}/>
              </div>
              {/* quick action row */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', marginTop:4 }}>
                <PillBtn onClick={() => setZoomed(true)}  color={S.sun}>Expand Monitor</PillBtn>
                <PillBtn onClick={() => setPanel('setup')} color={S.blue}>Camera Setup</PillBtn>
                <PillBtn onClick={() => setPanel('profile')} color={S.mint}>Choose Profile</PillBtn>
              </div>
            </motion.div>
          )}

          {!isAuth && (<>
          <motion.p initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.9,duration:.55,ease:[.22,1,.36,1]}}
            style={{ fontFamily:S.f.ui, fontWeight:500, fontSize:'clamp(15px,1.8vw,22px)', color:S.carbon, opacity:.65, maxWidth:520, margin:'clamp(16px,2vw,24px) auto 0', lineHeight:1.45, letterSpacing:'-0.01em', pointerEvents:'auto' }}>
            Smart Integrated Geo-Monitoring Assistant — real-time care for every step a visually impaired person takes.
          </motion.p>
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:1.05,duration:.5}}
            style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', marginTop:'clamp(20px,2.5vw,28px)', pointerEvents:'auto' }}>
            <CtaBtn onClick={onEnter}>Launch App</CtaBtn>
            <CtaBtn outline onClick={() => document.getElementById('sv-about')?.scrollIntoView({ behavior:'smooth' })}>Learn More</CtaBtn>
          </motion.div>
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:1.3,duration:.5}}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, marginTop:'clamp(14px,1.8vw,22px)', pointerEvents:'auto' }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center' }}>
              {[['IoT Smart Cane',S.mint],['Live Camera',S.lavender],['Location Tracking',S.sun]].map(([l,c])=><Tag key={l} color={c}>{l}</Tag>)}
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center' }}>
              {[['Obstacle Detection',S.ember],['Emergency Alerts',S.lavender],['Real-Time Alerts',S.mint]].map(([l,c])=><Tag key={l} color={c}>{l}</Tag>)}
            </div>
          </motion.div>
          </>)}
        </div>

        <Monitor tableRef={tableRef} monRef={monRef} isAuth={isAuth} camUrl={camUrl} pos={pos} onZoom={() => setZoomed(true)} activeProfile={activeProfile}/>

        <div ref={scrollHintRef} style={{ position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)', zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
          <div style={{ width:1, height:36, background:'linear-gradient(to bottom,transparent,rgba(0,0,0,0.3))' }}/>
          <span style={{ fontFamily:S.f.mono, fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:S.carbon, opacity:.45 }}>scroll</span>
        </div>
      </section>

      {/* ── zoomed monitor overlay ── */}
      {zoomed && (
        <>
          <div onClick={() => setZoomed(false)} style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(14px)' }}/>
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
            <button onClick={() => setZoomed(false)} style={{ position:'absolute', top:14, right:14, width:40, height:40, borderRadius:9999, background:S.carbon, border:`2px solid ${S.paper}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:10 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={S.paper} strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </>
      )}

      {/* ── Setup panel ── */}
      {panel === 'setup' && (
        <>
          <div onClick={() => setPanel(null)} style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(10px)' }}/>
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:201, width:'min(94vw,400px)' }}>
            <div style={{ background:S.paper, border:`2.5px solid ${S.carbon}`, borderRadius:28, overflow:'hidden', boxShadow:`7px 8px 0 ${S.carbon}` }}>
              <div style={{ background:S.blue, borderBottom:`2.5px solid ${S.carbon}`, padding:'18px 22px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontFamily:S.f.disp, fontWeight:900, fontSize:36, color:S.carbon, textTransform:'uppercase', lineHeight:.9 }}>CAMERA<br/>SETUP</span>
                <button onClick={() => setPanel(null)} style={{ width:34, height:34, borderRadius:9999, border:`2px solid ${S.carbon}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={S.carbon} strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <div style={{ padding:'20px 22px' }}>
                <label style={{ fontFamily:S.f.mono, fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:S.carbon, opacity:.5, display:'block', marginBottom:8 }}>ESP32-CAM Stream URL</label>
                <input value={camUrl} onChange={e => setCamUrl(e.target.value)} placeholder="http://192.168.x.x/stream"
                  style={{ width:'100%', padding:'12px 14px', borderRadius:14, border:`2px solid ${S.carbon}`, fontFamily:S.f.mono, fontSize:12, color:S.carbon, background:S.sky, outline:'none', boxSizing:'border-box' }}/>
                <p style={{ fontFamily:S.f.ui, fontSize:11, color:S.carbon, opacity:.45, margin:'8px 0 20px', lineHeight:1.5 }}>Paste your ESP32-CAM streaming URL. Make sure your device is on the same network.</p>
                <button onClick={() => setPanel(null)} style={{ width:'100%', padding:'14px', borderRadius:9999, border:`2px solid ${S.carbon}`, background:S.carbon, fontFamily:S.f.ui, fontWeight:700, fontSize:14, color:S.paper, cursor:'pointer', boxShadow:`3px 3px 0 ${S.blue}` }}>Save</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Tutorial panel ── */}
      {panel === 'tutorial' && <TutorialModal onClose={() => setPanel(null)}/>}

      {/* ── Profile orbit stack panel ── */}
      {panel === 'profile' && (
        <>
          <div onClick={() => setPanel(null)} style={{ position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(14px)' }}/>
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
                <button onClick={() => setPanel(null)} style={{ width:42,height:42,borderRadius:9999,border:`2px solid #fff`,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
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
        <div style={{ background:S.sky, borderTop:`1px solid ${S.carbon}`, padding:'72px clamp(20px,4vw,64px) clamp(40px,6vh,80px)' }}>
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
              <motion.p initial={{opacity:0,y:12}} whileInView={{opacity:1,y:0}} transition={{duration:.5}} viewport={{once:true}} style={{fontFamily:S.f.ui,fontWeight:700,fontSize:11,letterSpacing:'0.032em',textTransform:'uppercase',color:S.carbon,opacity:.4,marginBottom:14}}>About the System</motion.p>
              <h2 style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(68px,11vw,150px)',lineHeight:.8,color:S.carbon,margin:'0 0 28px',textTransform:'uppercase'}}>
                {['MORE','THAN','A DASH','BOARD.'].map((line,i)=>(<motion.span key={i} initial={{opacity:0,x:-24}} whileInView={{opacity:1,x:0}} transition={{duration:.48,delay:i*.08,ease:[.22,1,.36,1]}} viewport={{once:true}} style={{display:'block'}}>{line}</motion.span>))}
              </h2>
              <div style={{display:'flex',gap:12,alignItems:'flex-end',flexWrap:'wrap'}}>
                <FloatSticker src="/sticker-map.png" alt="" size={110} animName="map-sway" animDur="5s" rotate={-4}/>
                <FloatSticker src="/sticker-verified.png" alt="" size={90} animName="badge-spin" animDur="4s" rotate={8} style={{alignSelf:'flex-end'}}/>
              </div>
            </div>
            <motion.div initial={{opacity:0,y:32}} whileInView={{opacity:1,y:0}} transition={{duration:.65,ease:[.22,1,.36,1]}} viewport={{once:true}}>
              <p style={{fontFamily:S.f.ui,fontSize:'clamp(16px,1.6vw,21px)',fontWeight:700,lineHeight:1.38,letterSpacing:'-0.01em',color:S.carbon,margin:'0 0 16px'}}>SigmaVision is the web application built for S.I.G.M.A — the Smart Integrated Geo-Monitoring Assistant designed for visually impaired individuals and their caregivers.</p>
              <p style={{fontFamily:S.f.ui,fontSize:15,fontWeight:500,lineHeight:1.68,color:S.carbon,opacity:.6,margin:'0 0 14px'}}>It provides a real-time camera feed from the ESP32-CAM, location tracking via the phone GPS through the IoT system, obstacle detection through ultrasonic sensors, and emergency alerts — giving guardians a live window into every journey.</p>
              <p style={{fontFamily:S.f.ui,fontSize:15,fontWeight:500,lineHeight:1.68,color:S.carbon,opacity:.6,margin:'0 0 32px'}}>S.I.G.M.A aims to enhance independence for visually impaired individuals — combining IoT hardware with a secure web platform to improve safety, mobility, and peace of mind.</p>
              <CtaBtn onClick={onEnter}>Open Dashboard</CtaBtn>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="sv-services" style={{background:S.gray,borderBottom:`1px solid ${S.carbon}`,position:'relative',overflow:'hidden'}}>
        <Ribbon style={{top:'-5%',height:'clamp(140px,17vw,220px)',zIndex:0,opacity:.6}}/>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'clamp(64px,10vh,120px) clamp(24px,5vw,80px)'}}>
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:48,flexWrap:'wrap',gap:20}}>
            <div style={{position:'relative',zIndex:1}}>
              <p style={{fontFamily:S.f.ui,fontWeight:700,fontSize:11,letterSpacing:'0.032em',textTransform:'uppercase',color:S.carbon,opacity:.4,marginBottom:10}}>Core Features</p>
              <h2 style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(60px,9.5vw,130px)',lineHeight:.8,color:S.carbon,margin:0,textTransform:'uppercase'}}>HOW IT<br/>WORKS.</h2>
            </div>
            <FloatSticker src="/sticker-camera.png" alt="" size={120} animName="cam-float" animDur="5.5s" rotate={5}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:12}}>
            <FeatureCard n="01" title="Live Camera Feed" accent={S.lavender} icon="camera" desc="Real-time video stream from the ESP32-CAM on the smart cane. Guardians monitor the user's surroundings directly through the web interface, anytime."/>
            <FeatureCard n="02" title="IoT Location Tracking" accent={S.mint} icon="location" desc="The user's phone GPS is accessed through the IoT system and plotted on the map in real time — precise position, always knowing where they are."/>
            <FeatureCard n="03" title="Obstacle & Emergency Alerts" accent={S.sun} icon="bell" desc="Ultrasonic sensors detect nearby objects and trigger vibration and audio feedback. The emergency button instantly notifies caregivers with location and live video."/>
          </div>
        </div>
      </section>

      {/* ══ SYSTEM ══ */}
      <section id="sv-work" style={{background:S.sky,borderBottom:`1px solid ${S.carbon}`}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'clamp(64px,10vh,120px) clamp(24px,5vw,80px)'}}>
          <p style={{fontFamily:S.f.ui,fontWeight:700,fontSize:11,letterSpacing:'0.032em',textTransform:'uppercase',color:S.carbon,opacity:.4,marginBottom:14}}>System Modules</p>
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:52,flexWrap:'wrap',gap:24}}>
            <h2 style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(52px,8.5vw,116px)',lineHeight:.82,color:S.carbon,margin:0,textTransform:'uppercase'}}>INSIDE<br/>S.I.G.M.A.</h2>
            <div style={{display:'flex',gap:12,alignItems:'flex-end',flexWrap:'wrap'}}>
              <FloatSticker src="/sticker-rocket.png" alt="" size={110} animName="rocket-launch" animDur="4.2s" rotate={-12} style={{alignSelf:'center'}}/>
              <FloatSticker src="/sticker-map.png" alt="" size={100} animName="map-sway" animDur="5.4s" rotate={8} style={{alignSelf:'flex-end'}}/>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column'}}>
            {[{idx:'001',label:'Vision Module',color:S.lavender,icon:'camera',desc:'Live camera feed streams from the ESP32-CAM directly to the SIGMA web app via Wi-Fi — giving caregivers eyes on every path.'},{idx:'002',label:'Location Module',color:S.mint,icon:'location',desc:"The phone's built-in GPS is accessed through the IoT system and rendered on a live map — exact position, always."},{idx:'003',label:'Safety Module',color:S.sun,icon:'shield',desc:'HC-SR04 ultrasonic sensors measure distance. When obstacles are too close, vibration motors and buzzers activate immediately.'}].map(({idx,label,color,icon,desc},i)=>(
              <motion.div key={idx} initial={{opacity:0,x:-24}} whileInView={{opacity:1,x:0}} transition={{duration:.55,delay:i*.1,ease:[.22,1,.36,1]}} viewport={{once:true}} onClick={onEnter} onMouseEnter={e=>e.currentTarget.style.opacity='.6'} onMouseLeave={e=>e.currentTarget.style.opacity='1'} style={{display:'flex',alignItems:'center',gap:24,padding:'22px 0',borderBottom:`1px solid ${S.carbon}`,cursor:'pointer',transition:'opacity .18s'}}>
                <Sticker color={color} icon={icon} rotate={i%2===0?-6:8} size={50}/>
                <div style={{flex:1}}><p style={{fontFamily:S.f.mono,fontSize:10,color:S.carbon,opacity:.38,letterSpacing:'0.14em',textTransform:'uppercase',margin:'0 0 5px'}}>{idx} — {label}</p><h3 style={{fontFamily:S.f.ui,fontSize:'clamp(15px,1.7vw,21px)',fontWeight:700,color:S.carbon,margin:0,lineHeight:1.3,letterSpacing:'-0.01em',maxWidth:640}}>{desc}</h3></div>
                <div style={{width:34,height:34,borderRadius:9999,border:`1px solid ${S.carbon}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={S.carbon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ══ */}
      <section id="sv-faq" style={{background:S.paper,borderBottom:`1px solid ${S.carbon}`}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'clamp(64px,10vh,120px) clamp(24px,5vw,80px)'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:'clamp(36px,6vw,96px)',alignItems:'start'}}>
            <div style={{position:'sticky',top:80}}><Sticker color={S.violet} icon="check" rotate={-10} size={52} style={{marginBottom:18}}/><h2 style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(52px,7vw,96px)',lineHeight:.82,color:S.carbon,margin:'0 0 14px',textTransform:'uppercase'}}>COMMON<br/>QS.</h2><p style={{fontFamily:S.f.ui,fontSize:14,fontWeight:500,lineHeight:1.65,color:S.carbon,opacity:.5,margin:0}}>Everything you need to know about S.I.G.M.A and the SmartCane system.</p></div>
            <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} transition={{duration:.65,ease:[.22,1,.36,1]}} viewport={{once:true}}><MotionFAQ/></motion.div>
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section style={{background:S.gray,borderBottom:`1px solid ${S.carbon}`,position:'relative',overflow:'hidden'}}>
        <Ribbon style={{top:'-4%',height:'clamp(160px,20vw,260px)',zIndex:0,opacity:.88}}/>
        <Ribbon flip style={{bottom:'-4%',height:'clamp(140px,18vw,240px)',zIndex:0,opacity:.55}}/>
        <FloatSticker src="/sticker-rocket.png" alt="" size={110} animName="rocket-launch" animDur="4s" rotate={-14} style={{position:'absolute',top:'10%',left:'6%',zIndex:2,pointerEvents:'none'}}/>
        <FloatSticker src="/sticker-verified.png" alt="" size={100} animName="badge-spin" animDur="3.8s" rotate={12} style={{position:'absolute',bottom:'10%',right:'6%',zIndex:2,pointerEvents:'none'}}/>
        <div style={{maxWidth:900,margin:'0 auto',padding:'clamp(80px,12vh,160px) clamp(24px,5vw,80px)',textAlign:'center',position:'relative',zIndex:3}}>
          <motion.div initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}} transition={{duration:.7,ease:[.22,1,.36,1]}} viewport={{once:true}}>
            <h2 style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(68px,12vw,170px)',lineHeight:.78,color:S.carbon,margin:'0 0 clamp(20px,3vw,36px)',textTransform:'uppercase'}}>EVERY<br/>STEP<br/>COVERED.</h2>
            <p style={{fontFamily:S.f.ui,fontSize:'clamp(15px,1.5vw,19px)',fontWeight:500,lineHeight:1.55,color:S.carbon,opacity:.6,maxWidth:480,margin:'0 auto clamp(28px,4vw,44px)',letterSpacing:'-0.01em'}}>S.I.G.M.A brings real-time obstacle detection, IoT location tracking, and live video to the hands of every caregiver.</p>
            <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
              <CtaBtn onClick={onEnter}>Launch App</CtaBtn>
              <CtaBtn outline onClick={() => document.getElementById('sv-about')?.scrollIntoView({behavior:'smooth'})}>Learn More</CtaBtn>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ TAGLINE STRIP ══ */}
      <section style={{background:S.carbon,borderTop:`1px solid ${S.carbon}`,position:'relative',overflow:'visible',paddingTop:40,paddingBottom:0}}>
        <div style={{overflow:'hidden',marginBottom:14}}>
          <div className="sgr-l" style={{gap:14,alignItems:'center',padding:'0 7px'}}>
            {['SMART CANE TECH','REAL-TIME VISION','OBSTACLE ALERTS','IOT LOCATION','EVERY STEP SAFE','LIVE CAMERA FEED','SOS EMERGENCY','SMART CANE TECH','REAL-TIME VISION','OBSTACLE ALERTS','IOT LOCATION','EVERY STEP SAFE','LIVE CAMERA FEED','SOS EMERGENCY'].map((label,i)=>{const colors=[S.blue,S.paper,S.ember,S.sun,S.mint,S.lavender,S.violet];const textColors=[S.carbon,S.carbon,S.paper,S.carbon,S.carbon,S.carbon,S.paper];const ci=i%7;return(<div key={i} onClick={onEnter} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.04) rotate(-1deg)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1) rotate(0deg)'} style={{background:colors[ci],border:`2.5px solid ${S.carbon}`,borderRadius:18,padding:'18px 44px',cursor:'pointer',flexShrink:0,transition:'transform .2s cubic-bezier(.22,1,.36,1)',userSelect:'none'}}><span style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(36px,5vw,72px)',lineHeight:1,letterSpacing:'-0.01em',textTransform:'uppercase',color:textColors[ci],whiteSpace:'nowrap',fontStyle:'italic'}}>{label}</span></div>);})}
          </div>
        </div>
        <div style={{overflow:'hidden',paddingBottom:36}}>
          <div className="sgr-r" style={{gap:14,alignItems:'center',padding:'0 7px'}}>
            {['GUARDIAN DASHBOARD','ZERO BARRIERS','SIGMA SYSTEM','CARE ANYWHERE','EYES ON THE PATH','SAFE MOBILITY','ALWAYS CONNECTED','GUARDIAN DASHBOARD','ZERO BARRIERS','SIGMA SYSTEM','CARE ANYWHERE','EYES ON THE PATH','SAFE MOBILITY','ALWAYS CONNECTED'].map((label,i)=>{const colors=[S.lavender,S.sun,S.violet,S.mint,S.blue,S.ember,S.paper];const textColors=[S.carbon,S.carbon,S.paper,S.carbon,S.carbon,S.paper,S.carbon];const ci=i%7;return(<div key={i} onClick={onEnter} onMouseEnter={e=>e.currentTarget.style.transform='scale(1.04) rotate(1deg)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1) rotate(0deg)'} style={{background:colors[ci],border:`2.5px solid ${S.carbon}`,borderRadius:18,padding:'18px 44px',cursor:'pointer',flexShrink:0,transition:'transform .2s cubic-bezier(.22,1,.36,1)',userSelect:'none'}}><span style={{fontFamily:S.f.disp,fontWeight:900,fontSize:'clamp(36px,5vw,72px)',lineHeight:1,letterSpacing:'-0.01em',textTransform:'uppercase',color:textColors[ci],whiteSpace:'nowrap',fontStyle:'italic'}}>{label}</span></div>);})}
          </div>
        </div>
        <img src="/sticker-rocket.png"   className="stk-a" alt="" draggable={false} style={{position:'absolute',top:'50%',left:'8%', transform:'translateY(-50%) rotate(-14deg)',width:100,height:100,objectFit:'contain',pointerEvents:'none',zIndex:10}}/>
        <img src="/sticker-verified.png" className="stk-b" alt="" draggable={false} style={{position:'absolute',top:'35%',left:'30%',transform:'translateY(-50%) rotate(10deg)', width:88, height:88, objectFit:'contain',pointerEvents:'none',zIndex:10}}/>
        <img src="/sticker-map.png"      className="stk-c" alt="" draggable={false} style={{position:'absolute',top:'60%',left:'57%',transform:'translateY(-50%) rotate(-8deg)', width:96, height:96, objectFit:'contain',pointerEvents:'none',zIndex:10}}/>
        <img src="/sticker-camera.png"   className="stk-d" alt="" draggable={false} style={{position:'absolute',top:'40%',left:'80%',transform:'translateY(-50%) rotate(16deg)', width:108,height:108,objectFit:'contain',pointerEvents:'none',zIndex:10}}/>
      </section>

      {/* ══ close not-auth sections ══ */}
      </>)}

      {/* ══ FOOTER ══ */}
      <footer style={{background:S.carbon,padding:'clamp(16px,2vw,28px) clamp(24px,5vw,80px)',display:'flex',justifyContent:'center',alignItems:'center',borderTop:'1px solid rgba(255,255,255,0.08)'}}>
        <button onClick={isAuth ? handleLogout : onEnter}
          onMouseEnter={e=>e.currentTarget.style.opacity='.75'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}
          style={{fontFamily:S.f.ui,fontWeight:700,fontSize:14,color:S.carbon,background:S.paper,border:`1px solid ${S.paper}`,borderRadius:9999,padding:'10px 28px',cursor:'pointer',transition:'opacity .18s',letterSpacing:'0.032em'}}>
          {isAuth ? 'Sign Out' : 'Open App'}
        </button>
      </footer>
    </div>
  );
}
