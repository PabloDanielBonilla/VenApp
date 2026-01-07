"use client"

import { usePathname } from "next/navigation"
import { MobileNav } from "@/components/mobile-nav"
import { FloatingCameraButton } from "@/components/floating-camera-button"

const NO_NAV_ROUTES = ["/auth"]
const NO_CAMERA_ROUTES = ["/camera", "/foods/add", "/foods/edit"]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showNav = !NO_NAV_ROUTES.some(route => pathname.startsWith(route))
  const showCameraButton = showNav &&
    pathname !== "/profile" &&
    !NO_CAMERA_ROUTES.some(route => pathname.startsWith(route))

  return (
    <div 
      className="relative min-h-[100svh] bg-[#0B0B0B]"
      style={{
        paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))'
      }}
    >
      {children}
      {showNav && <MobileNav />}
      {showCameraButton && <FloatingCameraButton />}
    </div>
  )
}

