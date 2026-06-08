import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone, ShieldCheck, Loader2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  title?: string
}

function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

export default function LoginModal({ isOpen, onClose, onSuccess, title }: LoginModalProps) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [sentCode, setSentCode] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const login = useAuthStore((s) => s.login)

  useEffect(() => {
    if (!isOpen) {
      setPhone('')
      setCode('')
      setError('')
      setSentCode('')
      setCountdown(0)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isOpen])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startCountdown = useCallback(() => {
    setCountdown(60)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const handleSendCode = async () => {
    if (!isValidPhone(phone)) {
      setError('请输入正确的手机号')
      return
    }
    setSending(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const json = await res.json()
      if (json.success) {
        startCountdown()
        if (json.data?.mockCode) {
          setSentCode(json.data.mockCode)
        }
      } else {
        setError(json.error?.message || '发送失败')
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async () => {
    if (!isValidPhone(phone)) {
      setError('请输入正确的手机号')
      return
    }
    if (!code || code.length < 4) {
      setError('请输入验证码')
      return
    }
    setVerifying(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        const data = json.data as { token: string; user: { id: string; nickname: string; avatar_color: string; phone?: string } }
        login(data.token, data.user)
        onClose()
        onSuccess?.()
      } else {
        setError(json.error?.message || '验证码错误')
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-text-primary">
                {title || '登录笔境'}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-card text-text-secondary active:bg-bg-hover transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Phone */}
            <div className="mb-4">
              <p className="text-xs text-text-tertiary mb-2">手机号</p>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))
                    setError('')
                  }}
                  placeholder="请输入手机号"
                  maxLength={11}
                  className="w-full pl-10 pr-3 py-3 rounded-xl bg-bg-card border border-border text-sm text-text-primary
                             placeholder:text-text-muted focus:outline-none focus:border-accent/50"
                />
              </div>
            </div>

            {/* Code */}
            <div className="mb-4">
              <p className="text-xs text-text-tertiary mb-2">验证码</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ShieldCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                      setError('')
                    }}
                    placeholder="请输入验证码"
                    maxLength={6}
                    className="w-full pl-10 pr-3 py-3 rounded-xl bg-bg-card border border-border text-sm text-text-primary
                               placeholder:text-text-muted focus:outline-none focus:border-accent/50"
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSendCode}
                  disabled={countdown > 0 || sending || !isValidPhone(phone)}
                  className="px-4 py-3 rounded-xl bg-accent text-white text-sm font-medium shrink-0
                             disabled:opacity-40 active:bg-accent-hover transition-colors flex items-center gap-1.5"
                >
                  {sending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : countdown > 0 ? (
                    `${countdown}s`
                  ) : (
                    '获取验证码'
                  )}
                </motion.button>
              </div>
              {sentCode && (
                <p className="text-[10px] text-text-muted mt-1.5">
                  dev 模式验证码：{sentCode}
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-danger mb-4">{error}</p>
            )}

            {/* Login Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleVerify}
              disabled={verifying || !isValidPhone(phone) || code.length < 4}
              className="w-full py-3.5 rounded-2xl bg-accent text-white font-medium text-sm
                         flex items-center justify-center gap-2
                         disabled:opacity-40 active:bg-accent-hover transition-colors"
            >
              {verifying ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                '登录'
              )}
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
