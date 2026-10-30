import React, { useEffect } from 'react'

export default function Modal({ open, title, children, onClose }){
  useEffect(()=>{
    function onKey(e){ if(e.key === 'Escape') onClose && onClose() }
    if(open) window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  },[open,onClose])

  if(!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black opacity-40" onClick={()=>onClose && onClose()} />
      <div className="bg-white rounded-lg shadow-lg z-10 max-w-lg w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="text-gray-500" onClick={()=>onClose && onClose()}>✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
