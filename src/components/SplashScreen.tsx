import { useEffect, useState } from 'react'

interface SplashScreenProps {
  onFinished: () => void
}

export default function SplashScreen({ onFinished }: SplashScreenProps) {
  // iOS-safe phase system:
  // 'show'  — fully visible, all animations running (starts at 0ms)
  // 'fade'  — fading out (starts at 2000ms)
  // after 'fade' fades out (500ms), onFinished() is called
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)
  const [contentIn, setContentIn] = useState(false)

  useEffect(() => {
    // Small delay before content animates in — ensures first paint is the bg color
    const t0 = setTimeout(() => setContentIn(true), 80)
    // Start fade-out after 2s
    const t1 = setTimeout(() => setFading(true), 2000)
    // Unmount after fade completes
    const t2 = setTimeout(() => {
      setVisible(false)
      onFinished()
    }, 2550)
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2) }
  }, [onFinished])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      style={{
        // Cover the entire screen including safe-area zones on iPhone X+
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        // Use env() directly in the value — iOS Safari 11.1+ supports this
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #1a1207 0%, #2d1f08 50%, #1a1207 100%)',
        // Use opacity + transition for the fade — iOS handles this reliably
        opacity: fading ? 0 : 1,
        // Always specify a transition so iOS doesn't skip it
        transition: 'opacity 0.5s ease',
        // Prevent touch events from leaking through during fade
        pointerEvents: fading ? 'none' : 'all',
        // Prevent iOS from stretching the splash when the keyboard appears
        WebkitOverflowScrolling: 'auto' as Parameters<typeof String>[0],
      }}
    >
      {/* Ambient glow — CSS animation, iOS-compatible */}
      <div style={{
        position: 'absolute',
        width: '280px',
        height: '280px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(196,160,72,0.18) 0%, transparent 70%)',
        // Use -webkit-animation for older iOS 12
        animation: 'sw_pulse 2.4s ease-in-out infinite',
        WebkitAnimation: 'sw_pulse 2.4s ease-in-out infinite' as Parameters<typeof String>[0],
      }} />

      {/* Quill */}
      <div style={{
        fontSize: '54px',
        marginBottom: '18px',
        lineHeight: 1,
        // Use transform + opacity for GPU-accelerated transition — iOS prefers this
        transform: contentIn ? 'scale(1) translateY(0)' : 'scale(0.6) translateY(12px)',
        opacity: contentIn ? 1 : 0,
        transition: 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease',
        WebkitTransition: 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease' as Parameters<typeof String>[0],
        willChange: 'transform, opacity',
        filter: 'drop-shadow(0 0 18px rgba(196,160,72,0.55))',
      }}>
        🪶
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
        fontSize: 'clamp(26px, 7.5vw, 38px)',
        fontWeight: 700,
        color: '#f5e6c8',
        letterSpacing: '0.03em',
        margin: 0,
        textAlign: 'center',
        transform: contentIn ? 'translateY(0)' : 'translateY(14px)',
        opacity: contentIn ? 1 : 0,
        transition: 'transform 0.55s ease 0.1s, opacity 0.45s ease 0.1s',
        WebkitTransition: 'transform 0.55s ease 0.1s, opacity 0.45s ease 0.1s' as Parameters<typeof String>[0],
        willChange: 'transform, opacity',
        textShadow: '0 0 28px rgba(196,160,72,0.35)',
      }}>
        Poetry Assistant
      </h1>

      {/* Tagline */}
      <p style={{
        fontFamily: "'Crimson Pro', 'Georgia', serif",
        fontSize: 'clamp(13px, 3.2vw, 15px)',
        color: 'rgba(196,160,72,0.75)',
        fontStyle: 'italic',
        letterSpacing: '0.1em',
        marginTop: '10px',
        marginBottom: 0,
        textAlign: 'center',
        transform: contentIn ? 'translateY(0)' : 'translateY(10px)',
        opacity: contentIn ? 1 : 0,
        transition: 'transform 0.55s ease 0.18s, opacity 0.45s ease 0.18s',
        WebkitTransition: 'transform 0.55s ease 0.18s, opacity 0.45s ease 0.18s' as Parameters<typeof String>[0],
        willChange: 'transform, opacity',
      }}>
        Offline Tools for Verse &amp; Craft
      </p>

      {/* Ornament */}
      <div style={{
        marginTop: '26px',
        color: 'rgba(196,160,72,0.45)',
        fontSize: '13px',
        letterSpacing: '7px',
        transform: contentIn ? 'scaleX(1)' : 'scaleX(0)',
        opacity: contentIn ? 1 : 0,
        transition: 'transform 0.5s ease 0.28s, opacity 0.45s ease 0.28s',
        WebkitTransition: 'transform 0.5s ease 0.28s, opacity 0.45s ease 0.28s' as Parameters<typeof String>[0],
      }}>
        ✦ ✦ ✦
      </div>

      {/* Loading dots */}
      <div style={{
        marginTop: '38px',
        display: 'flex',
        gap: '8px',
        opacity: contentIn ? 1 : 0,
        transition: 'opacity 0.4s ease 0.35s',
        WebkitTransition: 'opacity 0.4s ease 0.35s' as Parameters<typeof String>[0],
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'rgba(196,160,72,0.65)',
            animation: `sw_dot 1.3s ease-in-out ${i * 0.22}s infinite`,
            WebkitAnimation: `sw_dot 1.3s ease-in-out ${i * 0.22}s infinite` as Parameters<typeof String>[0],
          }} />
        ))}
      </div>

      {/* Scoped keyframes — prefixed for older WebKit (iOS 12) */}
      <style>{`
        @-webkit-keyframes sw_pulse {
          0%, 100% { -webkit-transform: scale(1); opacity: 0.55; }
          50%       { -webkit-transform: scale(1.1); opacity: 1; }
        }
        @keyframes sw_pulse {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50%       { transform: scale(1.1); opacity: 1; }
        }
        @-webkit-keyframes sw_dot {
          0%, 100% { -webkit-transform: translateY(0); opacity: 0.35; }
          50%       { -webkit-transform: translateY(-6px); opacity: 1; }
        }
        @keyframes sw_dot {
          0%, 100% { transform: translateY(0); opacity: 0.35; }
          50%       { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
