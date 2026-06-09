import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  Globe,
  BookOpenCheck,
  SkipBack,
  Heart,
  Bookmark,
  Share2,
  X,
  Copy,
  Check,
} from 'lucide-react'
import { useStoryStore } from '../stores/storyStore'
import { useAuthStore } from '../stores/authStore'
import WorldDrawer from '../components/WorldDrawer'
import LoginModal from '../components/LoginModal'
import StoryIntroAnimation from '../components/StoryIntroAnimation'
import { getStoryDetail, generateChapterStream, toggleLike, toggleBookmark, createShareLink, rollbackToChapter } from '../api/client'
import { track } from '../utils/tracker'
import type { Chapter, WorldState, Story } from '../types'

function toChineseNumber(num: number): string {
  const chars = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
  if (num <= 10) {
    if (num === 10) return '十'
    return chars[num]
  }
  if (num < 20) return '十' + (num % 10 === 0 ? '' : chars[num % 10])
  if (num % 10 === 0) return chars[Math.floor(num / 10)] + '十'
  return chars[Math.floor(num / 10)] + '十' + chars[num % 10]
}

export default function ReaderPage() {
  const { storyId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const { setCurrentStory, setCurrentChapter, setWorldState, updateProgress } = useStoryStore()

  // Intro animation state
  const introState = (location.state as { isNew?: boolean; title?: string; summary?: string }) || {}
  const isNewStory = introState.isNew ?? false
  const [showIntro, setShowIntro] = useState(isNewStory)
  const [introFinished, setIntroFinished] = useState(false)

  const [showWorld, setShowWorld] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showChoices, setShowChoices] = useState(false)
  const [chapterKey, setChapterKey] = useState(0)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [previewChapter, setPreviewChapter] = useState<Chapter | null>(null)
  const [allChapters, setAllChapters] = useState<Chapter[]>([])
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const [world, setWorld] = useState<WorldState | null>(null)
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likes, setLikes] = useState(0)
  const [showLogin, setShowLogin] = useState(false)
  const [pendingAction, setPendingAction] = useState<'like' | 'bookmark' | null>(null)
  const [showShare, setShowShare] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const skipTypewriterRef = useRef(false)

  // Load story and initial chapter
  useEffect(() => {
    if (!storyId) return
    if (isNewStory && !introFinished) return

    let cancelled = false

    async function init(sid: string) {
      setLoading(true)
      setError('')
      try {
        const { story: s, chapters } = await getStoryDetail(sid)
        if (cancelled) return
        setStory(s)
        setCurrentStory(s)
        setIsLiked(s.isLiked || false)
        setIsBookmarked(s.isBookmarked || false)
        setLikes(s.likes || 0)
        setIsCompleted(s.status === 'completed')

        setAllChapters(chapters)

        if (chapters.length === 0) {
          // Generate first chapter with streaming
          setGenerating(true)
          setIsStreaming(true)
          setPreviewChapter({
            id: 'preview',
            storyId: sid,
            chapterNumber: 1,
            title: 'AI 正在创作中…',
            content: '',
            choices: [],
            createdAt: new Date().toISOString(),
          })
          setChapterKey((k) => k + 1)

          const { chapter: ch, worldState: ws } = await generateChapterStream(
            sid,
            undefined,
            undefined,
            (chunk) => {
              setPreviewChapter((prev) =>
                prev ? { ...prev, content: prev.content + chunk } : null
              )
            }
          )
          if (cancelled) return

          setAllChapters([ch])
          setCurrentChapterIndex(0)
          setChapter(ch)
          setWorld(ws)
          setCurrentChapter(ch)
          setWorldState(ws)
          setPreviewChapter(null)
          setIsStreaming(false)
          skipTypewriterRef.current = true
          setIsCompleted(ch.isFinale || false)
          track('chapter_read', { storyId: sid, chapterNumber: ch.chapterNumber })
        } else {
          const last = chapters[chapters.length - 1]
          setCurrentChapterIndex(chapters.length - 1)
          setChapter(last)
          const ws: WorldState = {
            storyId: sid,
            characters: [],
            timeline: [],
            currentChapter: last.chapterNumber,
          }
          setWorld(ws)
          setCurrentChapter(last)
          setWorldState(ws)
          setChapterKey((k) => k + 1)
          setIsCompleted(s.status === 'completed' || last.isFinale || false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载失败')
          setPreviewChapter(null)
          setIsStreaming(false)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setGenerating(false)
        }
      }
    }

    init(storyId)
    return () => {
      cancelled = true
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [storyId, setCurrentStory, setCurrentChapter, setWorldState, introFinished, isNewStory])

  // Typewriter effect
  useEffect(() => {
    if (!chapter) return

    if (skipTypewriterRef.current) {
      setDisplayedText(chapter.content)
      setIsTyping(false)
      setShowChoices(true)
      skipTypewriterRef.current = false
      return
    }

    setDisplayedText('')
    setIsTyping(true)
    setShowChoices(false)
    let index = 0
    const speed = 18
    const content = chapter.content

    if (timerRef.current) clearInterval(timerRef.current)

    const timer = setInterval(() => {
      if (index < content.length) {
        setDisplayedText(content.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
        setIsTyping(false)
        setTimeout(() => setShowChoices(true), 400)
      }
    }, speed)

    timerRef.current = timer
    return () => clearInterval(timer)
  }, [chapter, chapterKey])

  const handleChoice = useCallback(
    async (choiceId: string, choiceIndex: number) => {
      if (!storyId || !chapter || generating) return
      setShowChoices(false)
      setGenerating(true)
      setIsStreaming(true)
      setError('')

      track('choice_made', { storyId, chapterNumber: chapter.chapterNumber, choiceIndex })

      const nextSeq = chapter.chapterNumber + 1
      setPreviewChapter({
        id: 'preview',
        storyId,
        chapterNumber: nextSeq,
        title: 'AI 正在创作中…',
        content: '',
        choices: [],
        createdAt: new Date().toISOString(),
      })
      setChapterKey((k) => k + 1)

      try {
        const { chapter: nextCh, worldState: nextWs } = await generateChapterStream(
          storyId,
          chapter.id,
          choiceIndex,
          (chunk) => {
            setPreviewChapter((prev) =>
              prev ? { ...prev, content: prev.content + chunk } : null
            )
          }
        )

        setAllChapters((prev) => [...prev, nextCh])
        setCurrentChapterIndex((prev) => prev + 1)
        setChapter(nextCh)
        setWorld(nextWs)
        setCurrentChapter(nextCh)
        setWorldState(nextWs)
        updateProgress(storyId, nextCh.chapterNumber, choiceId)
        setPreviewChapter(null)
        setIsStreaming(false)
        skipTypewriterRef.current = true

        if (nextCh.isFinale) {
          setIsCompleted(true)
          track('story_completed', { storyId })
        }
        track('chapter_read', { storyId, chapterNumber: nextCh.chapterNumber })
      } catch (err) {
        setError(err instanceof Error ? err.message : '生成失败，请重试')
        setShowChoices(true)
        setPreviewChapter(null)
        setIsStreaming(false)
      } finally {
        setGenerating(false)
      }
    },
    [storyId, chapter, generating, setCurrentChapter, setWorldState, updateProgress]
  )

  const handleGoBack = useCallback(async () => {
    if (!storyId) return
    if (currentChapterIndex > 0) {
      const prevIndex = currentChapterIndex - 1
      const prevChapter = allChapters[prevIndex]

      // 调用后端回退API，删除后续章节
      try {
        await rollbackToChapter(storyId, prevChapter.id)
      } catch (err) {
        console.error('Rollback failed:', err)
      }

      // 前端状态更新
      setAllChapters((prev) => prev.slice(0, prevIndex + 1))
      setCurrentChapterIndex(prevIndex)
      setChapter(prevChapter)
      setChapterKey((k) => k + 1)
      skipTypewriterRef.current = true
      setShowChoices(true)
      setIsCompleted(false)
      setError('')
    } else {
      navigate('/')
    }
  }, [storyId, currentChapterIndex, allChapters, navigate])

  const handleLike = useCallback(async () => {
    if (!storyId) return
    if (!isLoggedIn) {
      setPendingAction('like')
      setShowLogin(true)
      return
    }
    try {
      const result = await toggleLike(storyId)
      setIsLiked(result.liked)
      setLikes(result.likes)
    } catch (err) {
      console.error('Like failed:', err)
    }
  }, [storyId, isLoggedIn])

  const handleBookmark = useCallback(async () => {
    if (!storyId) return
    if (!isLoggedIn) {
      setPendingAction('bookmark')
      setShowLogin(true)
      return
    }
    try {
      const result = await toggleBookmark(storyId)
      setIsBookmarked(result.bookmarked)
    } catch (err) {
      console.error('Bookmark failed:', err)
    }
  }, [storyId, isLoggedIn])

  const handleShare = useCallback(async () => {
    if (!storyId) return
    try {
      const result = await createShareLink(storyId)
      setShareUrl(result.shortUrl)
      setShowShare(true)
      track('story_shared', { storyId })
    } catch (err) {
      console.error('Share failed:', err)
    }
  }, [storyId])

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [shareUrl])

  const handleLoginSuccess = useCallback(() => {
    setShowLogin(false)
    if (pendingAction === 'like') {
      handleLike()
    } else if (pendingAction === 'bookmark') {
      handleBookmark()
    }
    setPendingAction(null)
  }, [pendingAction, handleLike, handleBookmark])

  const activeChapter = previewChapter || allChapters[currentChapterIndex] || chapter
  const maxChapters = story?.maxChapters || 12
  const progress = activeChapter ? (activeChapter.chapterNumber / maxChapters) * 100 : 0

  // Show intro animation
  if (showIntro && !introFinished) {
    return (
      <StoryIntroAnimation
        title={introState.title || story?.title || '新故事'}
        subtitle={introState.summary || story?.summary || ''}
        onComplete={() => {
          setShowIntro(false)
          setIntroFinished(true)
        }}
      />
    )
  }

  if (loading || (generating && !isStreaming)) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
        <p className="text-sm text-text-secondary">
          {generating ? 'AI 正在创作下一章…' : '加载中…'}
        </p>
      </div>
    )
  }

  if (error || !activeChapter) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-5">
        <p className="text-sm text-danger mb-4">{error || '章节加载失败'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium"
        >
          重试
        </button>
      </div>
    )
  }

  const contentToShow = isStreaming ? (previewChapter?.content || '') : displayedText

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 h-12">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-card text-text-secondary active:bg-bg-hover transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex flex-col items-center max-w-[55%]">
            <span className="text-[10px] text-text-tertiary truncate w-full text-center leading-tight">
              {story?.title || '笔境'}
            </span>
            <span className="text-xs text-text-secondary tracking-wide">
              第 {activeChapter.chapterNumber} 章
            </span>
          </div>

          <button
            onClick={() => setShowWorld(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-card text-text-secondary active:bg-bg-hover transition-colors"
          >
            <Globe size={16} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-bg-card">
          <motion.div
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </header>

      {/* Chapter Content */}
      <main className="flex-1 px-5 pt-6 pb-24 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={chapterKey}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Chapter title */}
            <h1 className="text-lg font-bold text-text-primary mb-2 text-center">
              <span className="mr-2">第{toChineseNumber(activeChapter.chapterNumber)}章</span>
              <span>{activeChapter.title}</span>
            </h1>


            {/* Content */}
            <div className="text-[15px] leading-[1.9] text-text-secondary font-serif">
              {contentToShow.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-5 text-justify indent-8">
                  {paragraph}
                </p>
              ))}
              {(isStreaming || isTyping) && (
                <span className="inline-block w-0.5 h-4 bg-accent animate-pulse ml-0.5 align-middle" />
              )}
            </div>

            {/* Completion panel */}
            {isCompleted && !isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-10 p-6 rounded-2xl bg-accent/5 border border-accent/20 text-center"
              >
                <BookOpenCheck size={32} className="mx-auto text-accent mb-3" />
                <h3 className="text-base font-bold text-text-primary mb-2">故事已完结</h3>
                <p className="text-sm text-text-secondary mb-4">
                  这个故事已经走到了终点。你可以选择回退到之前的章节重新选择，或者开始一个新的故事。
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium"
                  >
                    开启新故事
                  </button>
                </div>
              </motion.div>
            )}

            {/* Choices */}
            <AnimatePresence>
              {!isStreaming && showChoices && !isCompleted && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="mt-10 space-y-3"
                >
                  <p className="text-xs text-text-muted text-center mb-4">
                    你的选择将决定故事走向
                  </p>
                  {activeChapter.choices.map((choice, idx) => (
                    <motion.button
                      key={choice.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.12 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleChoice(choice.id, idx)}
                      className="w-full p-4 rounded-xl bg-bg-card border border-border
                                 text-sm text-text-primary text-left
                                 hover:border-accent/40 active:bg-bg-hover
                                 transition-all duration-200"
                    >
                      <span className="text-accent mr-2 font-medium">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      {choice.text}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Actions */}
      <footer className="sticky bottom-0 z-40 bg-bg/95 backdrop-blur-sm border-t border-border px-4 py-3 safe-area-bottom">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-text-tertiary
                       hover:text-text-secondary active:bg-bg-card transition-colors"
          >
            <SkipBack size={14} />
            回退
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs transition-colors ${
                isLiked ? 'text-danger bg-danger/10' : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
              {likes > 0 && <span>{likes}</span>}
            </button>
            <button
              onClick={handleBookmark}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs transition-colors ${
                isBookmarked ? 'text-accent bg-accent/10' : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <Share2 size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <BookOpenCheck size={14} />
            <span>第 {activeChapter.chapterNumber} 章</span>
          </div>
        </div>
      </footer>

      {/* World Drawer */}
      <WorldDrawer
        isOpen={showWorld}
        onClose={() => setShowWorld(false)}
        worldState={world}
      />

      {/* Login Modal */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSuccess={handleLoginSuccess} />

      {/* Share Modal */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
            onClick={() => setShowShare(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-bg w-full max-w-lg rounded-t-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-text-primary">分享故事</h3>
                <button onClick={() => setShowShare(false)} className="p-1 rounded-full hover:bg-bg-card">
                  <X size={18} className="text-text-secondary" />
                </button>
              </div>
              <div className="p-4 rounded-xl bg-bg-card border border-border mb-4">
                <p className="text-sm text-text-secondary break-all">{shareUrl}</p>
              </div>
              <button
                onClick={handleCopyLink}
                className="w-full py-3 rounded-xl bg-accent text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? '已复制' : '复制链接'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
