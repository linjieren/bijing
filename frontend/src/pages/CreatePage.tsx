import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Wand2,
  ArrowRight,
  BookOpen,
  Flame,
  Zap,
  Heart,
  Briefcase,
  Infinity,
  Skull,
  Shuffle,
} from 'lucide-react'
import { useStoryStore } from '../stores/storyStore'
import { genreConfigs, promptSuggestions } from '../data/mock'
import { createStory, getRandomPrompt } from '../api/client'
import { track } from '../utils/tracker'
import type { StoryGenre, StoryLength } from '../types'

const genreIcons: Record<StoryGenre, typeof BookOpen> = {
  ancient: BookOpen,
  scifi: Zap,
  suspense: Flame,
  romance: Heart,
  workplace: Briefcase,
  infinite: Infinity,
  apocalypse: Skull,
}

const lengthConfigs: { key: StoryLength; label: string; chapterRange: string }[] = [
  { key: 'short', label: '短篇', chapterRange: '5-8 章' },
  { key: 'medium', label: '中篇', chapterRange: '12-18 章' },
  { key: 'long', label: '长篇', chapterRange: '20-30 章' },
]

const genreToDefaultLength: Record<StoryGenre, StoryLength> = {
  suspense: 'short',
  infinite: 'short',
  romance: 'medium',
  workplace: 'medium',
  ancient: 'long',
  scifi: 'long',
  apocalypse: 'long',
}

export default function CreatePage() {
  const navigate = useNavigate()
  const { draftPrompt, draftGenre, draftLength, setDraftPrompt, setDraftGenre, setDraftLength } = useStoryStore()
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isRandomLoading, setIsRandomLoading] = useState(false)
  const [hasManualLength, setHasManualLength] = useState(false)

  const handleGenreSelect = useCallback(
    (genre: StoryGenre) => {
      const newGenre = draftGenre === genre ? null : genre
      setDraftGenre(newGenre)
      if (newGenre && !hasManualLength) {
        setDraftLength(genreToDefaultLength[newGenre])
      }
    },
    [draftGenre, setDraftGenre, hasManualLength, setDraftLength]
  )

  const handleLengthSelect = useCallback(
    (length: StoryLength) => {
      setDraftLength(draftLength === length ? null : length)
      setHasManualLength(true)
    },
    [draftLength, setDraftLength]
  )

  const handleSuggestionClick = useCallback(
    (suggestion: (typeof promptSuggestions)[0]) => {
      setDraftPrompt(suggestion.description)
      setDraftGenre(suggestion.genre)
      if (!hasManualLength) {
        setDraftLength(genreToDefaultLength[suggestion.genre])
      }
    },
    [setDraftPrompt, setDraftGenre, setDraftLength, hasManualLength]
  )

  const handleRandom = useCallback(async () => {
    setIsRandomLoading(true)
    try {
      const random = await getRandomPrompt()
      setDraftPrompt(random.description)
      if (random.genre) {
        setDraftGenre(random.genre)
        if (!hasManualLength) {
          setDraftLength(genreToDefaultLength[random.genre])
        }
      }
    } catch {
      // fallback to local mock
      const fallback = promptSuggestions[Math.floor(Math.random() * promptSuggestions.length)]
      setDraftPrompt(fallback.description)
      setDraftGenre(fallback.genre)
      if (!hasManualLength) {
        setDraftLength(genreToDefaultLength[fallback.genre])
      }
    } finally {
      setIsRandomLoading(false)
    }
  }, [setDraftPrompt, setDraftGenre, setDraftLength, hasManualLength])

  const handleCreate = useCallback(async () => {
    if (!draftPrompt.trim() || !draftGenre || isCreating) return
    setIsCreating(true)
    try {
      const story = await createStory({
        prompt: draftPrompt.trim(),
        genre: draftGenre,
        lengthPreference: draftLength || undefined,
      })
      track('story_created', { genre: draftGenre, promptLength: draftPrompt.trim().length, length: draftLength })
      navigate(`/reader/${story.id}`, { state: { isNew: true, title: story.title, summary: story.summary } })
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建失败，请重试')
    } finally {
      setIsCreating(false)
    }
  }, [draftPrompt, draftGenre, draftLength, isCreating, navigate])

  const filteredSuggestions = draftGenre
    ? promptSuggestions.filter((s) => s.genre === draftGenre)
    : promptSuggestions

  return (
    <div className="min-h-dvh bg-bg">
      {/* Header */}
      <header className="px-5 pt-8 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={20} className="text-accent" />
          <h1 className="text-xl font-bold text-text-primary">笔境</h1>
        </div>
        <p className="text-sm text-text-tertiary">一句话，开启你的互动故事</p>
      </header>

      {/* Prompt Input */}
      <section className="px-5 mb-6">
        <div className="relative">
          <textarea
            value={draftPrompt}
            onChange={(e) => setDraftPrompt(e.target.value)}
            placeholder="比如：我穿越成了大夏国最不受宠的七皇子，开局即被派去守皇陵，却意外激活了龙脉传承..."
            className="w-full min-h-[120px] p-4 rounded-2xl bg-bg-card border border-border
                       text-sm text-text-primary placeholder:text-text-muted
                       focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20
                       resize-none leading-relaxed"
          />
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              onClick={handleRandom}
              disabled={isRandomLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-bg-hover text-xs text-text-secondary
                         active:bg-bg-pressed transition-colors disabled:opacity-50"
            >
              {isRandomLoading ? (
                <span className="w-3 h-3 border-2 border-text-secondary/30 border-t-text-secondary rounded-full animate-spin" />
              ) : (
                <Shuffle size={12} />
              )}
              随机一个
            </button>
          </div>
        </div>
      </section>

      {/* Genre Selector */}
      <section className="px-5 mb-6">
        <p className="text-xs text-text-tertiary mb-3">选择风格</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
          {genreConfigs.map((genre) => {
            const Icon = genreIcons[genre.key]
            const isSelected = draftGenre === genre.key
            return (
              <motion.button
                key={genre.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleGenreSelect(genre.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium shrink-0
                           transition-all border ${
                             isSelected
                               ? `${genre.bgColor} ${genre.color} border-current`
                               : 'bg-bg-card text-text-secondary border-border'
                           }`}
              >
                <Icon size={14} />
                {genre.label}
              </motion.button>
            )
          })}
        </div>
      </section>

      {/* Length Selector */}
      <section className="px-5 mb-6">
        <p className="text-xs text-text-tertiary mb-3">故事长度</p>
        <div className="grid grid-cols-3 gap-2">
          {lengthConfigs.map((length) => {
            const isSelected = draftLength === length.key
            return (
              <motion.button
                key={length.key}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleLengthSelect(length.key)}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl text-xs font-medium
                           transition-all border ${
                             isSelected
                               ? 'bg-accent/10 border-accent text-accent'
                               : 'bg-bg-card border-border text-text-secondary'
                           }`}
              >
                <span className="text-sm">{length.label}</span>
                <span className="text-[10px] opacity-70">{length.chapterRange}</span>
              </motion.button>
            )
          })}
        </div>
      </section>

      {/* Create Button */}
      <section className="px-5 mb-8">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleCreate}
          disabled={!draftPrompt.trim() || !draftGenre || isCreating}
          className="w-full py-3.5 rounded-2xl bg-accent text-white font-medium text-sm
                     flex items-center justify-center gap-2
                     disabled:opacity-40 disabled:cursor-not-allowed
                     active:bg-accent-hover transition-colors"
        >
          {isCreating ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Wand2 size={18} />
          )}
          {isCreating ? '创作中…' : '开始创作'}
          <ArrowRight size={16} />
        </motion.button>
      </section>

      {/* Suggestions Toggle */}
      <section className="px-5 mb-3">
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="flex items-center gap-1 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
        >
          <Sparkles size={12} />
          热门设定推荐
          <motion.span animate={{ rotate: showSuggestions ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ArrowRight size={12} />
          </motion.span>
        </button>
      </section>

      {/* Suggestions Grid */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 pb-8 overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-3">
              {filteredSuggestions.map((suggestion, idx) => {
                const genreConfig = genreConfigs.find((g) => g.key === suggestion.genre)!
                return (
                  <motion.button
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-left p-4 rounded-2xl bg-bg-card border border-border
                               active:bg-bg-hover transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                        {suggestion.title}
                      </h3>
                      <span
                        className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full ${genreConfig.bgColor} ${genreConfig.color}`}
                      >
                        {genreConfig.label}
                      </span>
                    </div>
                    <p className="text-xs text-text-tertiary line-clamp-2 leading-relaxed">
                      {suggestion.description}
                    </p>
                  </motion.button>
                )
              })}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
