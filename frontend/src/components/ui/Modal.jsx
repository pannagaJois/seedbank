import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, title, children, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose && onClose()
    }
    if (open) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', onKey)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
        onClick={() => onClose && onClose()} 
      />
      {/* Modal Dialog Card */}
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 z-10 max-w-lg w-full overflow-hidden transform transition-all animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button 
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition cursor-pointer" 
            onClick={() => onClose && onClose()}
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
