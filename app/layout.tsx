// app/layout.tsx  (أو app/root-layout.tsx)
import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { Tajawal } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

// Providers / components
import { LoadingProvider } from "../components/ui/loading-context"
import MobileHeader from "../components/MobileHeader"
// ملاحظة: لم نضع SidebarProvider هنا حتى لا يحجز مساحة على الدسكتوب
// لو حابب تضيفه لاحقًا كـ overlay، أرسللي كود sidebar ونظبطه.

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
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <head>
        {/* Service Worker cleanup and deployment detection script */}
        <Script
          id="deployment-detection"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Check for deployment updates and clear old service workers
              (function() {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    registrations.forEach(function(reg) {
                      reg.unregister();
                    });
                  });
                }
                
                // Force cache busting on page load
                // Add a timestamp to all fetch requests to bypass stale caches
                if (typeof window !== 'undefined') {
                  const originalFetch = window.fetch;
                  window.fetch = function(...args) {
                    if (args[0] && typeof args[0] === 'string') {
                      const url = new URL(args[0], window.location.origin);
                      // Add cache buster to API calls
                      if (url.pathname.includes('/api/')) {
                        url.searchParams.set('_t', Date.now());
                      }
                      args[0] = url.toString();
                    }
                    return originalFetch.apply(this, args);
                  };
                }
                
                // Clear localStorage of old/stale auth tokens on app start
                try {
                  const token = localStorage.getItem('auth_token');
                  if (token) {
                    try {
                      const parts = token.split('.');
                      if (parts.length === 3) {
                        const payload = JSON.parse(atob(parts[1]));
                        const now = Date.now() / 1000;
                        // If token expired more than 2 minutes ago, clear it
                        if (payload.exp && payload.exp < now - 120) {
                          localStorage.removeItem('auth_token');
                          localStorage.removeItem('refresh_token');
                          console.log('[Layout] Cleared stale token on app start');
                        }
                      } else {
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('refresh_token');
                      }
                    } catch (e) {
                      localStorage.removeItem('auth_token');
                      localStorage.removeItem('refresh_token');
                    }
                  }
                } catch (e) {
                  // Ignore storage errors
                }
              })();
            `,
          }}
        />
      </head>
      {/* Note: body نظيف من أي padding عام (نضيف padding فقط على الـ main عند الموبايل) */}
      <body className={`${tajawal.className} antialiased`}>
        {/* ===== MobileHeader: يظهر فقط على الموبايل (md:hidden) ===== */}
        {/* MobileHeader نفسه يحتوي: fixed top-0 h-14 md:hidden */}
        <div className="md:hidden">
          <MobileHeader />
        </div>

        {/* ===== Main app wrapper ===== */}
        {/* نضع الـ main بحيث يحصل offset عند الموبايل فقط (pt-14) لتعويض الـ MobileHeader الثابت */}
        <LoadingProvider>
          <main className="min-h-screen pt-14 md:pt-0">
            {children}
          </main>
        </LoadingProvider>

        <Analytics />
      </body>
    </html>
  )
}
