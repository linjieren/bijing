import { useState, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  X,
  Bug,
  Lightbulb,
  Sparkles,
  HelpCircle,
  ImageIcon,
  Trash2,
  Send,
  CheckCircle2,
} from 'lucide-react'
import { submitFeedback } from '../api/client'

const feedbackTypes = [
  { key: 'bug', label: 'Bug', icon: Bug },
  { key: 'feature', label: '功能建议', icon: Lightbulb },
  { key: 'experience', label: '体验优化', icon: Sparkles },
  { key: 'other', label: '其他', icon: HelpCircle },
] as const

export default function FeedbackButton() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<string>('bug')
  const [content, setContent] = useState('')
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isReaderPage = location.pathname.startsWith('/reader/')

  const handleFileChange = useCallback(
    (file: File | null) => {
      if (!file) return
      if (file.size > 2 * 1024 * 1024) {
        setError('截图大小不能超过 2MB')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        setScreenshot(result)
        setError('')
      }
      reader.onerror = () => setError('截图读取失败')
      reader.readAsDataURL(file)
    },
    []
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) {
        handleFileChange(file)
      }
    },
    [handleFileChange]
  )

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('请填写反馈内容')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      await submitFeedback({
        type,
        content: content.trim(),
        screenshot: screenshot || undefined,
        routePath: location.pathname + location.search,
      })
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setIsOpen(false)
        setType('bug')
        setContent('')
        setScreenshot(null)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const reset = () => {
    setType('bug')
    setContent('')
    setScreenshot(null)
    setError('')
    setSubmitted(false)
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            reset()
            setIsOpen(true)
          }}
          className={`fixed right-4 z-40 w-12 h-12 rounded-full bg-accent text-white shadow-lg
                      flex items-center justify-center active:bg-accent-hover transition-colors
                      ${isReaderPage ? 'bottom-4' : 'bottom-20'}`}
        >
          <MessageSquare size={20} />
        </motion.button>
      )}

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-bg-elevated rounded-t-3xl max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="text-base font-semibold text-text-primary">用户反馈</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-card text-text-secondary active:bg-bg-hover transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {submitted ? (
                <div className="flex flex-col items-center justify-center py-16 px-5">
                  <CheckCircle2 size={48} className="text-accent mb-4" />
                  <p className="text-base font-medium text-text-primary">反馈已提交</p>
                  <p className="text-sm text-text-tertiary mt-1">感谢你的宝贵意见</p>
                </div>
              ) : (
                <>
                  {/* Type Selector */}
                  <div className="px-5 mb-4">
                    <p className="text-xs text-text-tertiary mb-2">反馈类型</p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {feedbackTypes.map((t) => {
                        const Icon = t.icon
                        const active = type === t.key
                        return (
                          <button
                            key={t.key}
                            onClick={() => setType(t.key)}
                            className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium shrink-0 transition-all ${
                              active
                                ? 'bg-accent text-white'
                                : 'bg-bg-card text-text-secondary border border-border'
                            }`}
                          >
                            <Icon size={13} />
                            {t.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-5 mb-4">
                    <p className="text-xs text-text-tertiary mb-2">详细描述</p>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="请描述你遇到的问题或建议..."
                      rows={4}
                      className="w-full p-3 rounded-xl bg-bg-card border border-border text-sm text-text-primary
                                 placeholder:text-text-muted resize-none focus:outline-none focus:border-accent/50"
                    />
                  </div>

                  {/* Screenshot */}
                  <div className="px-5 mb-4">
                    <p className="text-xs text-text-tertiary mb-2">截图（可选）</p>
                    {screenshot ? (
                      <div className="relative rounded-xl overflow-hidden border border-border">
                        <img src={screenshot} alt="screenshot" className="w-full h-32 object-cover" />
                        <button
                          onClick={() => setScreenshot(null)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white
                                     flex items-center justify-center active:bg-black/80 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        className="w-full h-24 rounded-xl border-2 border-dashed border-border bg-bg-card
                                   flex flex-col items-center justify-center gap-1.5 cursor-pointer
                                   active:bg-bg-hover transition-colors"
                      >
                        <ImageIcon size={20} className="text-text-muted" />
                        <span className="text-xs text-text-muted">点击或拖拽上传截图</span>
                        <span className="text-[10px] text-text-tertiary">支持 JPG/PNG，最大 2MB</span>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    />
                  </div>

                  {/* Route hint */}
                  <div className="px-5 mb-4">
                    <p className="text-[10px] text-text-muted">
                      当前页面：{location.pathname + location.search}
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="px-5 mb-3">
                      <p className="text-xs text-danger">{error}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <div className="px-5 pb-8 pt-2">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-2xl bg-accent text-white font-medium text-sm
                                 flex items-center justify-center gap-2
                                 disabled:opacity-50 active:bg-accent-hover transition-colors"
                    >
                      {isSubmitting ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                      {isSubmitting ? '提交中…' : '提交反馈'}
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
