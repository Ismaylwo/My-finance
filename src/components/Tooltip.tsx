import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { HelpCircle, X, Sparkles } from 'lucide-react'

interface TooltipProps {
  content: React.ReactNode
  title?: string
}

export default function Tooltip({ content, title }: TooltipProps) {
  const [open, setOpen] = useState(false)

  const modalContent = (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={() => setOpen(false)}
      />

      {/* Centered Modal Card (Escapes any parent container via React Portal!) */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md glass border border-indigo-500/50 rounded-2xl p-5 z-10 shadow-glow-primary animate-slide-in text-white space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{title || 'Подсказка по расчёту'}</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-xl glass text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs leading-relaxed text-white/90 space-y-2 py-1">
          {content}
        </div>

        <div className="border-t border-white/10 pt-3 text-right">
          <button
            onClick={() => setOpen(false)}
            className="btn-primary text-xs py-1.5 px-4"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 transition-all focus:outline-none ml-1 flex-shrink-0"
        title="Нажми для подсказки"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {open && createPortal(modalContent, document.body)}
    </>
  )
}
