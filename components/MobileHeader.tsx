'use client'

import React from 'react'
import { Menu } from 'lucide-react'
import { Button } from './ui/button'
import { useSidebar } from '@/components/ui/sidebar'

export default function MobileHeader() {
  // useSidebar requires SidebarProvider higher in the tree (layout wraps it)
  let toggle: (() => void) | null = null
  try {
    const s = useSidebar()
    toggle = s.toggleSidebar
  } catch (e) {
    toggle = null
  }

  const logoSrc = '/logo2.png'

  return (
    <header className="fixed top-0 inset-x-0 z-40 md:hidden bg-background/90 backdrop-blur-sm border-b border-slate-100">
      <div className="max-w-6xl mx-auto flex items-center gap-3 px-4 h-14">
        <div className="flex items-center gap-3">
          <Button onClick={() => toggle && toggle()} variant="ghost" size="icon" aria-label="فتح القائمة" className="p-2">
            <Menu className="size-5" />
          </Button>
        </div>
        <div className="flex-1 flex items-center">
          <div className="mx-auto">
            <img src={logoSrc} alt="logo" className="h-8 object-contain" />
          </div>
        </div>
      </div>
    </header>
  )
}
