import { motion } from 'framer-motion';

export function LampContainer({ children, className = '' }) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      background: '#0d0a1a',
      padding: 'clamp(80px,12vh,160px) 0 clamp(60px,8vh,100px)',
      zIndex: 0,
      className,
    }}>
      {/* Lamp beam structure */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 900,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 1,
      }}>
        {/* Left conic beam */}
        <motion.div
          initial={{ width: '8rem', opacity: 0.5 }}
          whileInView={{ width: '24rem', opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            height: '2px',
            background: 'linear-gradient(to right, transparent, #a855f7)',
            transformOrigin: 'right center',
            transform: 'translateX(-100%)',
          }}
        />
        {/* Right conic beam */}
        <motion.div
          initial={{ width: '8rem', opacity: 0.5 }}
          whileInView={{ width: '24rem', opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          style={{
            position: 'absolute',
            right: '50%',
            top: 0,
            height: '2px',
            background: 'linear-gradient(to left, transparent, #a855f7)',
            transformOrigin: 'left center',
            transform: 'translateX(100%)',
          }}
        />

        {/* Left conic gradient glow */}
        <motion.div
          initial={{ width: '8rem', opacity: 0 }}
          whileInView={{ width: '26rem', opacity: 1 }}
          transition={{ delay: 0.3, duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            height: 'clamp(200px,36vh,440px)',
            transform: 'translateX(-100%)',
            transformOrigin: 'right top',
            background: 'conic-gradient(from 70deg at 100% 0%, #5b21b6 0deg, #7c3aed 15deg, transparent 60deg)',
            opacity: 0.55,
            filter: 'blur(2px)',
          }}
        />

        {/* Right conic gradient glow */}
        <motion.div
          initial={{ width: '8rem', opacity: 0 }}
          whileInView={{ width: '26rem', opacity: 1 }}
          transition={{ delay: 0.3, duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          style={{
            position: 'absolute',
            right: '50%',
            top: 0,
            height: 'clamp(200px,36vh,440px)',
            transform: 'translateX(100%)',
            transformOrigin: 'left top',
            background: 'conic-gradient(from 290deg at 0% 0%, #5b21b6 0deg, #7c3aed 15deg, transparent 60deg)',
            opacity: 0.55,
            filter: 'blur(2px)',
          }}
        />

        {/* Center ambient glow orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          style={{
            position: 'absolute',
            top: -60,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'clamp(200px,36vw,480px)',
            height: 'clamp(200px,36vw,480px)',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.45) 0%, rgba(109,40,217,0.2) 40%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Top lamp bar (the horizontal glowing line) */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          width: '100%',
          justifyContent: 'center',
        }}>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: 'clamp(120px,24vw,300px)' }}
            transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            style={{
              height: 3,
              borderRadius: 9999,
              background: 'linear-gradient(to right, #7c3aed, #a855f7, #c084fc, #a855f7, #7c3aed)',
              boxShadow: '0 0 20px 4px rgba(168,85,247,0.8), 0 0 60px 8px rgba(109,40,217,0.4)',
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {children}
      </div>
    </div>
  );
}
