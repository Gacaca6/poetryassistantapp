import { useState, useEffect } from 'react'

interface SplashScreenProps {
  onFinished: () => void
}

export default function SplashScreen({ onFinished }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 2200)
    const removeTimer = setTimeout(() => onFinished(), 2800)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [onFinished])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 15% 10%, hsla(37, 54%, 51%, 0.07) 0%, transparent 55%), radial-gradient(ellipse at 85% 90%, hsla(8, 55%, 35%, 0.05) 0%, transparent 55%)',
      }}
    >
      {/* Logo */}
      <div className="relative mb-6 animate-splash-logo">
        <img
          src="/pwa-512.png"
          alt="Poetry Assistant"
          className="w-28 h-28 rounded-[22px] shadow-xl"
        />
      </div>

      {/* Title */}
      <div className="animate-splash-text text-center">
        <div className="text-xs text-gold tracking-[0.6rem] mb-2 opacity-60">✦  ◈  ✦</div>
        <h1 className="font-display text-3xl font-bold tracking-tight mb-1">
          Poetry <em className="italic text-rust">Assistant</em>
        </h1>
        <p className="text-sm italic text-muted-foreground font-light">
          Offline tools for the craft of verse
        </p>
      </div>

      {/* Bottom loading dots */}
      <div className="absolute bottom-16 flex flex-col items-center gap-3 animate-splash-text">
        <div className="flex gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-splash-dot1" />
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-splash-dot2" />
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-splash-dot3" />
        </div>
      </div>
    </div>
  )
}
