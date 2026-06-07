import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  Globe,
  BookOpenCheck,
  SkipBack,
} from 'lucide-react'
import { useStoryStore } from '../stores/storyStore'
import WorldDrawer from '../components/WorldDrawer'
import { getStoryDetail, generateChapterStream } from '../api/client'
import type { Chapter, WorldState, Story } from '../types'

export default function ReaderPage() {
  const { storyId } = useParams()
  const navigate = useNavigate()
  const { setCurrentStory, setCurrentChapter, setWorldState, updateProgress } = useStoryStore()
  const [showWorld, setShowWorld] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showChoices, setShowChoices] = useState(false)
  const [chapterKey, setChapterKey] = useState(0)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [previewChapter, setPreviewChapter] = useState<Chapter | null>(null)
  const [world, setWorld] = useState<WorldState | null>(null)
  const [, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const skipTypewriterRef = useRef(false)

  // Load story and initial chapter
  useEffect(() => {
    if (!storyId) return

    let cancelled = false

    async function init(sid: string) {
      setLoading(true)
      setError('')
      try {
        const { story: s, chapters } = await getStoryDetail(sid)
        if (cancelled) return
        setStory(s)
        setCurrentStory(s)

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

          setChapter(ch)
          setWorld(ws)
          setCurrentChapter(ch)
          setWorldState(ws)
          setPreviewChapter(null)
          setIsStreaming(false)
          skipTypewriterRef.current = true
        } else {
          const last = chapters[chapters.length - 1]
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
  }, [storyId, setCurrentStory, setCurrentChapter, setWorldState])

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

        setChapter(nextCh)
        setWorld(nextWs)
        setCurrentChapter(nextCh)
        setWorldState(nextWs)
        updateProgress(storyId, nextCh.chapterNumber, choiceId)
        setPreviewChapter(null)
        setIsStreaming(false)
        skipTypewriterRef.current = true
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

  const handleGoBack = useCallback(() => {
    navigate(-1)
  }, [navigate])

  const activeChapter = previewChapter || chapter
  const progress = activeChapter ? (activeChapter.chapterNumber / 12) * 100 : 0

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

          <div className="flex flex-col items-center">
            <span className="text-xs text-text-tertiary">
              第 {activeChapter.chapterNumber} 章
            </span>
            <span className="text-sm font-medium text-text-primary">
              {activeChapter.title}
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
      <main className="flex-1 px-5 py-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={chapterKey}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Chapter title */}
            <h1 className="text-lg font-bold text-text-primary mb-6 text-center">
              {activeChapter.title}
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

            {/* Choices */}
            <AnimatePresence>
              {!isStreaming && showChoices && (
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

          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <BookOpenCheck size={14} />
            <span>
              {activeChapter.chapterNumber} / 12 章
            </span>
          </div>
        </div>
      </footer>

      {/* World Drawer */}
      <WorldDrawer
        isOpen={showWorld}
        onClose={() => setShowWorld(false)}
        worldState={world}
      />
    </div>
  )
}
