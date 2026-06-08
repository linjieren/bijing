import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import LoginModal from '../components/LoginModal'
import { useState } from 'react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(true)

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Header */}
      <header className="px-5 pt-8 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={20} className="text-accent" />
          <h1 className="text-xl font-bold text-text-primary">笔境</h1>
        </div>
        <p className="text-sm text-text-tertiary">登录后解锁更多功能</p>
      </header>

      {/* Features */}
      <div className="flex-1 px-5 py-6 space-y-4">
        {[
          '保存创作到云端，永不丢失',
          '发布故事到广场，让更多人看到',
          '点赞收藏，打造个人书架',
          '多设备同步，随时续读',
        ].map((text, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-bg-card border border-border"
          >
            <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
            <span className="text-sm text-text-secondary">{text}</span>
          </motion.div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="px-5 pb-8 space-y-3 safe-area-bottom">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="w-full py-3.5 rounded-2xl bg-accent text-white font-medium text-sm
                     active:bg-accent-hover transition-colors"
        >
          立即登录
        </motion.button>
        <button
          onClick={() => navigate('/create')}
          className="w-full py-3 rounded-2xl text-sm text-text-tertiary
                     hover:text-text-secondary transition-colors"
        >
          先匿名体验
        </button>
      </div>

      <LoginModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  )
}
