// app/root-layout.tsx أو app/layout.tsx
import type React from "react"
import type { Metadata } from "next"
import { Tajawal } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
})

export const metadata: Metadata = {
  title: "نظام الأرشفة الموحد - زوايا البناء",
  description: "نظام إدارة المراسلات والأرشفة الرقمية",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

import { LoadingProvider } from "../components/ui/loading-context"
import MobileHeader from "../components/MobileHeader"
import { SidebarProvider } from "../components/ui/sidebar"
import ClientSetup from "../components/ClientSetup"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      {/* 
        pt-14 فقط للموبايل عشان الـ MobileHeader fixed 
        md:pt-0 يلغي البادينج على الديسكتوب
      */}
      <body className={`${tajawal.className} antialiased pt-14 md:pt-0`}>
        <SidebarProvider>
          <LoadingProvider>
            <ClientSetup>
              {/* Mobile header: fixed on top, visible only on small screens */}
              <div className="fixed top-0 inset-x-0 z-50 md:hidden">
                <MobileHeader />
              </div>

              {/* 
                Main container:
                - min-h-screen يحافظ على الارتفاع الكامل
                - md:pr-64 يضيف مساحة على اليمين على الدسكتوب لتجنب تداخل المحتوى مع sidebar
                  (عدل 64 لو Sidebar عندك بعرض مختلف، مثلاً md:pr-72 أو md:pr-56)
              */}
              <div className="min-h-screen md:pr-64">
                {children}
              </div>
            </ClientSetup>
          </LoadingProvider>
        </SidebarProvider>

        <Analytics />
      </body>
    </html>
  )
}
