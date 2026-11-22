/**
 * HowItWorks.jsx — SigmaVision flowchart
 * Simple visual flowchart showing how the system works.
 * Non-technical language, slush theme.
 */

const S = {
  carbon: '#000000', paper: '#ffffff', sky: '#dceeff',
  blue: '#4da2ff', mint: '#55db9c', ember: '#fb4903',
  sun: '#ffd731', violet: '#5c4ade', lavender: '#e9ccff',
  fD: "'Barlow Condensed','Bebas Neue',Impact,sans-serif",
  fU: "'DM Sans',ui-sans-serif,sans-serif",
  fM: "'IBM Plex Mono',ui-monospace,monospace",
};

/* ── Single node ── */
function Node({ label, sub, color = S.paper, width = 220, icon }) {
  return (
    <div style={{
      width, background: color,
      border: `2.5px solid ${S.carbon}`,
      borderRadius: 12,
      padding: '14px 20px',
      boxShadow: `4px 4px 0 ${S.carbon}`,
      textAlign: 'center',
      position: 'relative',
    }}>
      {icon && <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>}
      <div style={{
        fontFamily: S.fD, fontWeight: 900,
        fontSize: 'clamp(15px,2vw,22px)',
        textTransform: 'uppercase',
        color: S.carbon, lineHeight: 1.1,
        letterSpacing: '-0.01em',
      }}>{label}</div>
      {sub && (
        <div style={{
          fontFamily: S.fU, fontSize: 12, fontWeight: 500,
          color: S.carbon, opacity: .6, marginTop: 6, lineHeight: 1.4,
        }}>{sub}</div>
      )}
    </div>
  );
}

/* ── Arrow down ── */
function ArrowDown({ label, color = S.carbon }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '4px 0' }}>
      <div style={{ width: 2, height: 28, background: color, opacity: .5 }}/>
      {label && (
        <div style={{
          fontFamily: S.fM, fontSize: 10, fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color, opacity: .6, margin: '2px 0',
        }}>{label}</div>
      )}
      {/* arrowhead */}
      <svg width="12" height="8" viewBox="0 0 12 8">
        <path d="M0 0 L6 8 L12 0" fill={color} opacity=".5"/>
      </svg>
    </div>
  );
}

/* ── Diamond decision node ── */
function Diamond({ label, yesLabel = 'YES', noLabel = 'NO', yesColor = S.mint, noColor = S.ember }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* diamond shape via CSS transform */}
      <div style={{
        width: 160, height: 60,
        background: S.sun,
        border: `2.5px solid ${S.carbon}`,
        borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `4px 4px 0 ${S.carbon}`,
        position: 'relative',
      }}>
        <span style={{
          fontFamily: S.fD, fontWeight: 900, fontSize: 16,
          textTransform: 'uppercase', color: S.carbon,
          letterSpacing: '-0.01em', textAlign: 'center',
          lineHeight: 1.1,
        }}>{label}</span>
      </div>
      {/* yes/no labels */}
      <div style={{ display: 'flex', gap: 80, marginTop: 6 }}>
        <span style={{ fontFamily: S.fM, fontSize: 10, fontWeight: 700, color: yesColor, letterSpacing: '0.1em' }}>{yesLabel} ↓</span>
        <span style={{ fontFamily: S.fM, fontSize: 10, fontWeight: 700, color: noColor, letterSpacing: '0.1em' }}>↑ {noLabel}</span>
      </div>
    </div>
  );
}

export default function HowItWorks({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(12px,3vw,40px)',
      overflowY: 'auto',
    }}>
      <div style={{
        background: S.sky,
        border: `2.5px solid ${S.carbon}`,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: `8px 10px 0 ${S.carbon}`,
        width: '100%',
        maxWidth: 680,
        maxHeight: '92vh',
        overflowY: 'auto',
      }}>
        {/* header */}
        <div style={{
          background: S.carbon,
          padding: '18px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div>
            <div style={{ fontFamily: S.fM, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: S.paper, opacity: .4, marginBottom: 4 }}>SigmaVision</div>
            <div style={{ fontFamily: S.fD, fontWeight: 900, fontSize: 'clamp(22px,4vw,36px)', color: S.paper, textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1 }}>HOW IT WORKS</div>
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ width: 36, height: 36, borderRadius: 9999, border: `2px solid rgba(255,255,255,0.3)`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* flowchart body */}
        <div style={{ padding: 'clamp(20px,4vw,40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

          {/* START */}
          <Node label="START" color={S.carbon} width={140}
            sub={<span style={{color:'rgba(255,255,255,0.6)',fontFamily:S.fU,fontSize:11}}>Caregiver opens the app</span>}/>
          <div style={{textAlign:'center',marginTop:4,fontFamily:S.fD,fontWeight:900,fontSize:12,color:S.carbon,letterSpacing:'-0.01em'}}>
          </div>
          <ArrowDown/>

          {/* Log in */}
          <Node label="Log In" sub="Enter your email and password" color={S.lavender} width={240}/>
          <ArrowDown/>

          {/* Dashboard opens */}
          <Node label="Dashboard Opens" sub="SIGMAVISION loads — monitor is ready" color={S.paper} width={280}/>
          <ArrowDown/>

          {/* Two parallel paths */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 16, width: '100%', maxWidth: 560,
            alignItems: 'start',
          }}>

            {/* LEFT — Camera path */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
              <div style={{ fontFamily: S.fM, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: S.carbon, opacity: .45, marginBottom: 8 }}>Camera path</div>
              <Node label="Go to Setup" sub="Paste the camera's URL" color={S.blue} width={200}/>
              <ArrowDown color={S.blue}/>
              <Node label="Camera Connects" sub="Live video appears on the left side of the monitor" color={S.lavender} width={200}/>
              <ArrowDown color={S.blue}/>
              <Node label="See What They See" sub="Stream updates live. Badge shows speed in ms." color={S.paper} width={200}/>
            </div>

            {/* RIGHT — GPS path */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
              <div style={{ fontFamily: S.fM, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: S.carbon, opacity: .45, marginBottom: 8 }}>GPS path</div>
              <Node label="Go to Tutorial" sub="Copy the mobile link from Step 3" color={S.mint} width={200}/>
              <ArrowDown color={S.mint}/>
              <Node label="Phone Opens Link" sub="Cane user taps 'Enable GPS' on their phone" color={S.sun} width={200}/>
              <ArrowDown color={S.mint}/>
              <Node label="Location Updates" sub="Dot appears on the map. Badge shows last update time." color={S.paper} width={200}/>
            </div>
          </div>

          <ArrowDown/>

          {/* Obstacle sensors */}
          <Node label="Sensors on the Cane" sub="Two sensors measure what's ahead. If something is too close — the cane vibrates and buzzes." color={S.ember} width={320}
          />
          <ArrowDown/>

          {/* Decision */}
          <div style={{
            background: S.sun, border: `2.5px solid ${S.carbon}`,
            borderRadius: 12, padding: '14px 24px',
            boxShadow: `4px 4px 0 ${S.carbon}`,
            textAlign: 'center', width: 280,
          }}>
            <div style={{ fontFamily: S.fD, fontWeight: 900, fontSize: 18, textTransform: 'uppercase', color: S.carbon, letterSpacing: '-0.01em' }}>Obstacle detected?</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', maxWidth: 420, margin: '8px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
              <div style={{ fontFamily: S.fM, fontSize: 10, fontWeight: 700, color: S.mint, letterSpacing: '0.1em', marginBottom: 4 }}>NO</div>
              <Node label="All Clear" sub="Cane user walks normally" color={S.mint} width={180}/>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
              <div style={{ fontFamily: S.fM, fontSize: 10, fontWeight: 700, color: S.ember, letterSpacing: '0.1em', marginBottom: 4 }}>YES</div>
              <Node label="Cane Buzzes" sub="Person feels it before reaching the obstacle" color={S.ember} width={180}/>
            </div>
          </div>

          <ArrowDown/>

          {/* END */}
          <Node label="Caregiver Stays Informed" sub="Camera + GPS + Sensors — all visible in one browser tab" color={S.carbon} width={340}
          />

          {/* version note */}
          <div style={{ marginTop: 24, fontFamily: S.fM, fontSize: 9, color: S.carbon, opacity: .3, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            SigmaVision — Naga City Science High School
          </div>
        </div>
      </div>
    </div>
  );
}
