import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Clock } from 'lucide-react';
import type { WorldState } from '../types';

interface WorldDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  worldState: WorldState | null;
}

export default function WorldDrawer({ isOpen, onClose, worldState }: WorldDrawerProps) {
  if (!worldState) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-bg-elevated z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
              <h2 className="text-base font-semibold text-text-primary">世界状态</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-card text-text-secondary active:bg-bg-hover transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
              {/* Characters */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Users size={16} className="text-accent" />
                  <h3 className="text-sm font-medium text-text-secondary">主要角色</h3>
                </div>
                <div className="space-y-2">
                  {worldState.characters.map((char) => (
                    <div
                      key={char.id}
                      className="p-3 rounded-xl bg-bg-card border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent-dim flex items-center justify-center text-accent text-sm font-bold shrink-0">
                          {char.name[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary">
                              {char.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-dim text-accent">
                              {char.relationship}
                            </span>
                          </div>
                          <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">
                            {char.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Timeline */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-accent" />
                  <h3 className="text-sm font-medium text-text-secondary">事件时间线</h3>
                </div>
                <div className="relative pl-6">
                  {/* Vertical line */}
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                  <div className="space-y-3">
                    {worldState.timeline.map((event, idx) => (
                      <div key={event.id} className="relative flex gap-3">
                        {/* Dot */}
                        <div
                          className={`absolute left-[-13px] top-1 w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center shrink-0 ${
                            idx === worldState.timeline.length - 1
                              ? 'border-accent bg-accent'
                              : 'border-border bg-bg-elevated'
                          }`}
                        >
                          {idx === worldState.timeline.length - 1 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] text-text-muted">{event.timestamp}</span>
                          <p className="text-xs text-text-secondary mt-0.5">{event.event}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
