import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Smartphone, ShieldCheck } from 'lucide-react'
import { sendVerificationCode, verifyPhone } from '../api/client'

interface LoginModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function LoginModal({ open, onClose, onSuccess }: LoginModalProps) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  useEffect(() => {
    if (open) {
      setPhone('')
      setCode('')
      setError('')
      setCountdown(0)
    }
  }, [open])

  const handleSendCode = useCallback(async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入有效的手机号')
      return
    }
    setError('')
    setLoading(true)
    try {
      const result = await sendVerificationCode(phone)
      setCountdown(60)
      if (result.mockCode) {
        setCode(result.mockCode)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败')
    } finally {
      setLoading(false)
    }
  }, [phone])

  const handleVerify = useCallback(async () => {
    if (!code || code.length < 4) {
      setError('请输入验证码')
      return
    }
    setError('')
    setLoading(true)
    try {
      await verifyPhone(phone, code)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证失败')
    } finally {
      setLoading(false)
    }
  }, [phone, code, onSuccess])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-bg-elevated rounded-t-3xl px-5 pt-5 pb-8"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-text-primary">绑定手机号</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-card text-text-secondary active:bg-bg-hover transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-sm text-text-tertiary mb-5">
              绑定手机号后，你可以将故事发布到广场，让更多人看到。
            </p>

            {/* Phone */}
            <div className="mb-4">
              <label className="block text-xs text-text-muted mb-1.5">手机号</label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-bg-card border border-border">
                <Smartphone size={16} className="text-text-muted shrink-0" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="请输入手机号"
                  className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
                />
              </div>
            </div>

            {/* Code */}
            <div className="mb-5">
              <label className="block text-xs text-text-muted mb-1.5">验证码</label>
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-bg-card border border-border">
                  <ShieldCheck size={16} className="text-text-muted shrink-0" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="请输入验证码"
                    className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
                  />
                </div>
                <button
                  onClick={handleSendCode}
                  disabled={countdown > 0 || loading}
                  className={`shrink-0 px-4 py-3 rounded-xl text-xs font-medium transition-colors ${
                    countdown > 0 || loading
                      ? 'bg-bg-card text-text-muted cursor-not-allowed'
                      : 'bg-accent text-white active:bg-accent-hover'
                  }`}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-danger mb-4">{error}</p>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleVerify}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-accent text-white text-sm font-medium active:bg-accent-hover transition-colors disabled:opacity-60"
            >
              {loading ? '验证中...' : '确认绑定'}
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
