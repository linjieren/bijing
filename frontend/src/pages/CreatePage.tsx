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
import { createStory } from '../api/client'
import type { StoryGenre } from '../types'

const genreIcons: Record<StoryGenre, typeof BookOpen> = {
  ancient: BookOpen,
  scifi: Zap,
  suspense: Flame,
  romance: Heart,
  workplace: Briefcase,
  infinite: Infinity,
  apocalypse: Skull,
}

export default function CreatePage() {
  const navigate = useNavigate()
  const { draftPrompt, draftGenre, setDraftPrompt, setDraftGenre } = useStoryStore()
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const handleGenreSelect = useCallback(
    (genre: StoryGenre) => {
      setDraftGenre(draftGenre === genre ? null : genre)
    },
    [draftGenre, setDraftGenre]
  )

  const handleSuggestionClick = useCallback(
    (suggestion: (typeof promptSuggestions)[0]) => {
      setDraftPrompt(suggestion.description)
      setDraftGenre(suggestion.genre)
    },
    [setDraftPrompt, setDraftGenre]
  )

  const handleRandom = useCallback(() => {
    const random = promptSuggestions[Math.floor(Math.random() * promptSuggestions.length)]
    setDraftPrompt(random.description)
    setDraftGenre(random.genre)
  }, [setDraftPrompt, setDraftGenre])

  const handleCreate = useCallback(async () => {
    if (!draftPrompt.trim() || !draftGenre || isCreating) return
    setIsCreating(true)
    try {
      const story = await createStory({ prompt: draftPrompt.trim(), genre: draftGenre })
      navigate(`/reader/${story.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建失败，请重试')
    } finally {
      setIsCreating(false)
    }
  }, [draftPrompt, draftGenre, isCreating, navigate])

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
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-bg-hover text-xs text-text-secondary
                         active:bg-bg-pressed transition-colors"
            >
              <Shuffle size={12} />
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
