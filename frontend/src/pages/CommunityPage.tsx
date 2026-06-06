import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass,
  Heart,
  Bookmark,
  TrendingUp,
  Clock,
  Grid3x3,
  Share2,
  X,
  Copy,
  Check,
} from 'lucide-react'
import { genreConfigs } from '../data/mock'
import { getSquareStories, toggleLike, toggleBookmark, createShareLink } from '../api/client'
import type { Story, StoryGenre } from '../types'

type TabType = 'hot' | 'latest' | 'genre'

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<TabType>('hot')
  const [selectedGenre, setSelectedGenre] = useState<StoryGenre | null>(null)
  const [showShare, setShowShare] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState('')
  const [shareCode, setShareCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const sortMap: Record<TabType, 'hot' | 'latest' | 'favorites'> = {
    hot: 'hot',
    latest: 'latest',
    genre: 'hot',
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const sort = sortMap[activeTab]
        const list = await getSquareStories(sort)
        if (!cancelled) setStories(list)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [activeTab])

  const filteredStories = selectedGenre
    ? stories.filter((s) => s.genre === selectedGenre)
    : stories

  const handleLike = async (story: Story) => {
    try {
      const result = await toggleLike(story.id)
      setStories((prev) =>
        prev.map((s) =>
          s.id === story.id
            ? { ...s, isLiked: result.liked, likes: result.likes }
            : s
        )
      )
    } catch {
      // silently fail for like
    }
  }

  const handleBookmark = async (story: Story) => {
    try {
      const result = await toggleBookmark(story.id)
      setStories((prev) =>
        prev.map((s) =>
          s.id === story.id
            ? { ...s, isBookmarked: result.bookmarked }
            : s
        )
      )
    } catch {
      // silently fail for bookmark
    }
  }

  const handleShare = async (storyId: string) => {
    try {
      const { shortUrl, code } = await createShareLink(storyId)
      setShareUrl(shortUrl)
      setShareCode(code)
      setShowShare(storyId)
      setCopied(false)
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shortUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      const url = `${window.location.origin}/reader/${storyId}`
      setShareUrl(url)
      setShareCode('')
      setShowShare(storyId)
    }
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const tabs: { key: TabType; label: string; icon: typeof TrendingUp }[] = [
    { key: 'hot', label: '热门', icon: TrendingUp },
    { key: 'latest', label: '最新', icon: Clock },
    { key: 'genre', label: '分类', icon: Grid3x3 },
  ]

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
        <div className="flex items-center gap-2 mb-4">
          <Compass size={20} className="text-accent" />
          <h1 className="text-xl font-bold text-text-primary">故事广场</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key)
                if (tab.key !== 'genre') setSelectedGenre(null)
              }}
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

      {/* Genre Filter */}
      <AnimatePresence>
        {activeTab === 'genre' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 mb-4 overflow-hidden"
          >
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedGenre(null)}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                  selectedGenre === null
                    ? 'bg-accent text-white'
                    : 'bg-bg-card text-text-secondary'
                }`}
              >
                全部
              </button>
              {genreConfigs.map((genre) => (
                <button
                  key={genre.key}
                  onClick={() => setSelectedGenre(genre.key)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                    selectedGenre === genre.key
                      ? `${genre.bgColor} ${genre.color}`
                      : 'bg-bg-card text-text-secondary'
                  }`}
                >
                  {genre.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Grid */}
      <div className="px-5 pb-8">
        {filteredStories.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20">
            <p className="text-sm text-text-muted">暂无故事</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredStories.map((story, idx) => (
              <StoryCard
                key={story.id}
                story={story}
                index={idx}
                onLike={() => handleLike(story)}
                onBookmark={() => handleBookmark(story)}
                onShare={() => handleShare(story.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Share Panel */}
      <AnimatePresence>
        {showShare && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowShare(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-bg-elevated rounded-t-3xl px-5 pt-5 pb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-text-primary">分享故事</h3>
                <button
                  onClick={() => setShowShare(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-card text-text-secondary active:bg-bg-hover transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 p-3 rounded-xl bg-bg-card border border-border text-sm text-text-secondary truncate">
                  {shareUrl}
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-accent text-white text-sm font-medium active:bg-accent-hover transition-colors"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? '已复制' : '复制'}
                </motion.button>
              </div>
              {shareCode && (
                <p className="text-xs text-text-muted">
                  分享码：{shareCode}
                </p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function StoryCard({
  story,
  index,
  onLike,
  onBookmark,
  onShare,
}: {
  story: Story
  index: number
  onLike: () => void
  onBookmark: () => void
  onShare: () => void
}) {
  const genreConfig = genreConfigs.find((g) => g.key === story.genre)!

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-bg-card rounded-2xl border border-border overflow-hidden"
    >
      {/* Cover */}
      <div
        className={`h-28 ${genreConfig.bgColor} flex items-center justify-center text-3xl font-bold ${genreConfig.color}`}
      >
        {story.title[0]}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-text-primary line-clamp-1 mb-1">
          {story.title}
        </h3>
        <div className="flex items-center gap-1.5 mb-2">
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
            style={{ backgroundColor: story.authorAvatarColor || '#8B5CF6' }}
          >
            {(story.authorNickname || story.authorName || '匿')[0]}
          </div>
          <p className="text-[10px] text-text-muted">
            {story.authorNickname || story.authorName}
          </p>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${genreConfig.bgColor} ${genreConfig.color}`}>
            {genreConfig.label}
          </span>
          <span className="text-[9px] text-text-muted">
            {story.totalChapters} 章
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onLike}
              className={`flex items-center gap-1 text-[10px] transition-colors ${
                story.isLiked ? 'text-danger' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <Heart size={13} fill={story.isLiked ? 'currentColor' : 'none'} />
              {story.likes}
            </button>
            <button
              onClick={onBookmark}
              className={`flex items-center gap-1 text-[10px] transition-colors ${
                story.isBookmarked ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <Bookmark size={13} fill={story.isBookmarked ? 'currentColor' : 'none'} />
              {story.bookmarks}
            </button>
          </div>

          <button
            onClick={onShare}
            className="text-text-muted hover:text-text-secondary transition-colors"
          >
            <Share2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
