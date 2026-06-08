import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface StoryIntroAnimationProps {
  title: string
  subtitle?: string
  onComplete: () => void
  duration?: number
}

export default function StoryIntroAnimation({
  title,
  subtitle,
  onComplete,
  duration = 4000,
}: StoryIntroAnimationProps) {
  const [phase, setPhase] = useState<'entering' | 'holding' | 'exiting' | 'done'>('entering')

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase('holding'), 1200)
    const exitTimer = setTimeout(() => setPhase('exiting'), duration)
    const doneTimer = setTimeout(() => setPhase('done'), duration + 800)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
    }
  }, [duration])

  useEffect(() => {
    if (phase === 'done') {
      onComplete()
    }
  }, [phase, onComplete])

  const handleSkip = useCallback(() => {
    if (phase === 'done') return
    setPhase('exiting')
    setTimeout(() => setPhase('done'), 800)
  }, [phase])

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center px-8 cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'exiting' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: phase === 'exiting' ? 0.8 : 0.6, ease: 'easeInOut' }}
          onClick={handleSkip}
        >
          {/* Decorative top line */}
          <motion.div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-16 h-px bg-white/30"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
          />

          {/* Title */}
          <motion.h1
            className="text-2xl font-bold text-white text-center tracking-widest mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          >
            {title}
          </motion.h1>

          {/* Subtitle / Tagline */}
          {subtitle && (
            <motion.p
              className="text-sm text-white/60 text-center leading-relaxed max-w-xs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
            >
              {subtitle}
            </motion.p>
          )}

          {/* Decorative bottom line */}
          <motion.div
            className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-16 h-px bg-white/30"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
          />

          {/* Skip hint */}
          <motion.span
            className="absolute bottom-12 text-xs text-white/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.5 }}
          >
            点击跳过
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
