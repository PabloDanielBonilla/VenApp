"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Home, ChefHat, UtensilsCrossed, User as UserIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    name: "Inicio",
    path: "/",
    icon: Home,
  },
  {
    name: "Alimentos",
    path: "/foods",
    icon: UtensilsCrossed,
  },
  {
    name: "Recetas",
    path: "/recipes",
    icon: ChefHat,
  },
  {
    name: "Perfil",
    path: "/profile",
    icon: UserIcon,
  },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 h-24 bg-[#0B0B0B] border-t border-white/10 pt-2">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.path
          const Icon = item.icon

          return (
            <a
              key={item.path}
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6 transition-all duration-200",
                  isActive ? "scale-110" : "scale-100"
                )}
              />
              <span className="text-xs font-medium">{item.name}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}

