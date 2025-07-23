'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { MessageSquare, BarChart3 } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()

  const navigation = [
    {
      name: 'Chat',
      href: '/',
      icon: MessageSquare,
      current: pathname === '/'
    },
    {
      name: 'Indicatori',
      href: '/indicators',
      icon: BarChart3,
      current: pathname === '/indicators'
    }
  ]

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-[#3a88ff]">OKR Agent</h1>
            </div>
            <div className="hidden md:block">
              <div className="flex items-baseline space-x-4">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        item.current
                          ? 'bg-[#3a88ff] text-white'
                          : 'text-slate-600 hover:text-[#3a88ff] hover:bg-[#3a88ff]/5'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
} 