import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Play,
  Pause,
  Trash2,
  Clock,
  Plus,
  BookX,
} from 'lucide-react'
import { useStoryStore } from '../stores/storyStore'
import { genreConfigs } from '../data/mock'
import { getStories, deleteStory as apiDeleteStory } from '../api/client'
import type { Story } from '../types'

export default function MyStoriesPage() {
  const navigate = useNavigate()
  const { stories, setStories, deleteStory } = useStoryStore()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const list = await getStories()
        if (!cancelled) setStories(list)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [setStories])

  const handleContinue = (storyId: string) => {
    navigate(`/reader/${storyId}`)
  }

  const handleDelete = async (storyId: string) => {
    try {
      await apiDeleteStory(storyId)
      deleteStory(storyId)
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
    setDeleteId(null)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const readingStories = stories.filter((s) => s.status === 'reading')
  const pausedStories = stories.filter((s) => s.status === 'paused')

  if (loading) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-5">
        <p className="text-sm text-danger mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium"
        >
          重试
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-bg">
      {/* Header */}
      <header className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-accent" />
            <h1 className="text-xl font-bold text-text-primary">我的故事</h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-card text-text-secondary active:bg-bg-hover transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
      </header>

      {stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-5 pt-20">
          <div className="w-20 h-20 rounded-full bg-bg-card flex items-center justify-center mb-5">
            <BookX size={32} className="text-text-muted" />
          </div>
          <h2 className="text-base font-medium text-text-secondary mb-2">还没有故事</h2>
          <p className="text-sm text-text-muted text-center mb-6">
            去创作页面，开启你的第一个互动故事吧
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-2xl bg-accent text-white text-sm font-medium
                       active:bg-accent-hover transition-colors"
          >
            开始创作
          </button>
        </div>
      ) : (
        <div className="px-5 pb-8 space-y-8">
          {/* Reading */}
          {readingStories.length > 0 && (
            <section>
              <h2 className="text-xs text-text-muted font-medium mb-3 uppercase tracking-wider">正在阅读</h2>
              <div className="space-y-3">
                {readingStories.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    onContinue={() => handleContinue(story.id)}
                    onDelete={() => setDeleteId(story.id)}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Paused */}
          {pausedStories.length > 0 && (
            <section>
              <h2 className="text-xs text-text-muted font-medium mb-3 uppercase tracking-wider">已暂停</h2>
              <div className="space-y-3">
                {pausedStories.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    onContinue={() => handleContinue(story.id)}
                    onDelete={() => setDeleteId(story.id)}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

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
              <p className="text-sm text-text-tertiary mb-5">
                删除后无法恢复，确定要继续吗？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-3 rounded-xl bg-bg-card text-sm text-text-secondary font-medium
                             active:bg-bg-hover transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 py-3 rounded-xl bg-danger/15 text-danger text-sm font-medium
                             active:bg-danger/25 transition-colors"
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

function StoryCard({
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
        {/* Cover placeholder */}
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
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-text-muted
                         hover:text-danger active:bg-bg-hover transition-colors"
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

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
          <span>第 {story.currentChapter} / {story.totalChapters} 章</span>
          <span>{story.progress}%</span>
        </div>
        <div className="h-1 bg-bg-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${story.progress}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onContinue}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent text-white text-xs font-medium
                     active:bg-accent-hover transition-colors"
        >
          {story.status === 'reading' ? <Play size={13} /> : <Pause size={13} />}
          {story.status === 'reading' ? '继续阅读' : '恢复阅读'}
        </button>
      </div>
    </motion.div>
  )
}
