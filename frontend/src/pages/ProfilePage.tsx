import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  BookOpen,
  Heart,
  Bookmark,
  Play,
  Trash2,
  Clock,
  BookX,
} from 'lucide-react'
import { genreConfigs } from '../data/mock'
import {
  getStories,
  getLikedStories,
  getFavoritedStories,
  deleteStory as apiDeleteStory,
} from '../api/client'
import type { Story } from '../types'

type TabKey = 'stories' | 'liked' | 'favorited'

interface TabDef {
  key: TabKey
  label: string
  icon: typeof BookOpen
}

const tabs: TabDef[] = [
  { key: 'stories', label: '我的故事', icon: BookOpen },
  { key: 'liked', label: '喜欢', icon: Heart },
  { key: 'favorited', label: '收藏', icon: Bookmark },
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('stories')
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        let list: Story[] = []
        if (activeTab === 'stories') {
          list = await getStories()
        } else if (activeTab === 'liked') {
          list = await getLikedStories()
        } else {
          list = await getFavoritedStories()
        }
        if (!cancelled) setStories(list)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [activeTab])

  const handleDelete = async (storyId: string) => {
    try {
      await apiDeleteStory(storyId)
      setStories((prev) => prev.filter((s) => s.id !== storyId))
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
    setDeleteId(null)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="min-h-dvh bg-bg">
      {/* Header */}
      <header className="px-5 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-full bg-accent/15 flex items-center justify-center">
            <User size={24} className="text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">我的</h1>
            <p className="text-xs text-text-muted mt-0.5">管理你的创作与互动</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-accent text-white'
                  : 'bg-bg-card text-text-secondary hover:text-text-primary'
              }`}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="px-5 pb-8">
        {loading && (
          <div className="flex items-center justify-center pt-20">
            <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center pt-20">
            <p className="text-sm text-danger mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium"
            >
              重试
            </button>
          </div>
        )}

        {!loading && !error && stories.length === 0 && (
          <EmptyState tab={activeTab} />
        )}

        {!loading && !error && stories.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {activeTab === 'stories'
                ? stories.map((story) => (
                    <MyStoryCard
                      key={story.id}
                      story={story}
                      onContinue={() => navigate(`/reader/${story.id}`)}
                      onDelete={() => setDeleteId(story.id)}
                      formatDate={formatDate}
                    />
                  ))
                : stories.map((story, idx) => (
                    <InteractiveStoryCard
                      key={story.id}
                      story={story}
                      index={idx}
                      onClick={() => navigate(`/reader/${story.id}`)}
                    />
                  ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 bottom-8 z-50 bg-bg-elevated rounded-2xl p-5 max-w-sm mx-auto"
            >
              <h3 className="text-base font-medium text-text-primary mb-2">删除故事</h3>
              <p className="text-sm text-text-tertiary mb-5">删除后无法恢复，确定要继续吗？</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-3 rounded-xl bg-bg-card text-sm text-text-secondary font-medium active:bg-bg-hover transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 py-3 rounded-xl bg-danger/15 text-danger text-sm font-medium active:bg-danger/25 transition-colors"
                >
                  删除
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function EmptyState({ tab }: { tab: TabKey }) {
  const navigate = useNavigate()
  const config = {
    stories: {
      icon: BookX,
      title: '还没有故事',
      desc: '去创作页面，开启你的第一个互动故事吧',
      action: '开始创作',
      onClick: () => navigate('/'),
    },
    liked: {
      icon: Heart,
      title: '还没有喜欢的故事',
      desc: '在广场里发现好故事，点赞收藏在这里',
      action: '去广场逛逛',
      onClick: () => navigate('/community'),
    },
    favorited: {
      icon: Bookmark,
      title: '还没有收藏的故事',
      desc: '在广场里发现好故事，收藏后在这里查看',
      action: '去广场逛逛',
      onClick: () => navigate('/community'),
    },
  }
  const c = config[tab]
  const Icon = c.icon

  return (
    <div className="flex flex-col items-center justify-center pt-20">
      <div className="w-20 h-20 rounded-full bg-bg-card flex items-center justify-center mb-5">
        <Icon size={32} className="text-text-muted" />
      </div>
      <h2 className="text-base font-medium text-text-secondary mb-2">{c.title}</h2>
      <p className="text-sm text-text-muted text-center mb-6">{c.desc}</p>
      <button
        onClick={c.onClick}
        className="px-6 py-3 rounded-2xl bg-accent text-white text-sm font-medium active:bg-accent-hover transition-colors"
      >
        {c.action}
      </button>
    </div>
  )
}

function MyStoryCard({
  story,
  onContinue,
  onDelete,
  formatDate,
}: {
  story: Story
  onContinue: () => void
  onDelete: () => void
  formatDate: (d: string) => string
}) {
  const genreConfig = genreConfigs.find((g) => g.key === story.genre)!

  return (
    <motion.div
      whileTap={{ scale: 0.99 }}
      className="p-4 rounded-2xl bg-bg-card border border-border"
    >
      <div className="flex gap-3 mb-3">
        <div
          className={`w-16 h-20 rounded-lg shrink-0 flex items-center justify-center text-xl font-bold ${genreConfig.bgColor} ${genreConfig.color}`}
        >
          {story.title[0]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium text-text-primary truncate">{story.title}</h3>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-text-muted hover:text-danger active:bg-bg-hover transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <p className="text-xs text-text-tertiary mt-1 line-clamp-1">{story.summary}</p>

          <div className="flex items-center gap-2 mt-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${genreConfig.bgColor} ${genreConfig.color}`}>
              {genreConfig.label}
            </span>
            <span className="text-[10px] text-text-muted flex items-center gap-0.5">
              <Clock size={10} />
              {formatDate(story.lastUpdatedAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
          <span>
            第 {story.currentChapter} / {story.totalChapters} 章
          </span>
          <span>{story.progress}%</span>
        </div>
        <div className="h-1 bg-bg-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${story.progress}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onContinue}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent text-white text-xs font-medium active:bg-accent-hover transition-colors"
        >
          <Play size={13} />
          继续阅读
        </button>
      </div>
    </motion.div>
  )
}

function InteractiveStoryCard({
  story,
  index,
  onClick,
}: {
  story: Story
  index: number
  onClick: () => void
}) {
  const genreConfig = genreConfigs.find((g) => g.key === story.genre)!

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className="flex gap-3 p-3 rounded-2xl bg-bg-card border border-border active:bg-bg-hover transition-colors cursor-pointer"
    >
      <div
        className={`w-14 h-[4.5rem] rounded-xl shrink-0 flex items-center justify-center text-lg font-bold ${genreConfig.bgColor} ${genreConfig.color}`}
      >
        {story.title[0]}
      </div>

      <div className="flex-1 min-w-0 py-0.5">
        <h3 className="text-sm font-medium text-text-primary truncate mb-1">{story.title}</h3>

        <div className="flex items-center gap-1.5 mb-1.5">
          <div
            className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0"
            style={{ backgroundColor: story.authorAvatarColor || '#8B5CF6' }}
          >
            {(story.authorNickname || story.authorName || '匿')[0]}
          </div>
          <p className="text-[10px] text-text-muted">
            {story.authorNickname || story.authorName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${genreConfig.bgColor} ${genreConfig.color}`}>
            {genreConfig.label}
          </span>
          <span className="text-[9px] text-text-muted">{story.totalChapters} 章</span>
        </div>
      </div>
    </motion.div>
  )
}
