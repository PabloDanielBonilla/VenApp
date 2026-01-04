import { ReactNode } from "react"

interface MobileWrapperProps {
  children: ReactNode
  className?: string
}

export function MobileWrapper({ children, className = "" }: MobileWrapperProps) {
  return (
    <div className={`min-h-screen pb-[calc(4rem+env(safe-area-inset-bottom))] ${className}`}>
      {children}
    </div>
  )
}

