'use client'

import React from 'react'
import { Menu } from 'lucide-react'
import { useSidebar } from './ui/sidebar'

export default function MobileHeader() {
  const { toggleSidebar } = useSidebar()

  return (
    <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-white border-b border-slate-100">
      <div className="max-w-6xl mx-auto flex items-center justify-between p-3">
        <button
          aria-label="قائمة"
          onClick={toggleSidebar}
          className="p-2 rounded-md text-slate-700 hover:bg-slate-100"
        >
          <Menu size={20} />
        </button>

        <div className="text-sm font-black text-slate-900">مركز الأرشفة</div>

        <div className="w-8" />
      </div>
    </div>
  )
}
