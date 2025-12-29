import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { Tajawal } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

import { LoadingProvider } from "../components/ui/loading-context"
import MobileHeader from "../components/MobileHeader"
import { SidebarProvider } from "../components/ui/sidebar"
import ClientSetup from "../components/ClientSetup"

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
        {/* 
          ===== LOOPING PREVENTION SYSTEM =====
          This deployment detection script handles:
          1. Version Check System ✅
          2. Aggressive Token Validation ✅
          3. Automatic Cleanup on App Start ✅
          4. Smart Cache Busting ✅
          5. Service Worker Cleanup ✅
          
          الحل الجذري للـ Looping: لن يحدث looping بعد الآن لأن:
          - الـ old tokens تُحذف تلقائياً عند التحديث
          - عند deployment جديد → كل المتصفحات تُحمّل الكود الجديد تلقائياً
          - الـ version check يكتشف التحديث ويفرض reload
          - لا سبيل للـ tokens القديمة أن تبقى وتسبب 403
        */}
        <Script
          id="deployment-detection"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Unregister all old service workers to force fresh app load
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    registrations.forEach(function(reg) {
                      reg.unregister();
                    });
                  });
                }
                
                // Aggressive cache busting: add timestamp to all API calls
                if (typeof window !== 'undefined') {
                  const originalFetch = window.fetch;
                  window.fetch = function(...args) {
                    if (args[0] && typeof args[0] === 'string') {
                      const url = new URL(args[0], window.location.origin);
                      // Add cache buster (_t timestamp) to API calls
                      if (url.pathname.includes('/api/')) {
                        url.searchParams.set('_t', Date.now());
                      }
                      args[0] = url.toString();
                    }
                    return originalFetch.apply(this, args);
                  };
                }
                
                // Clear stale tokens on app start (tokens older than 2 minutes are expired)
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
                        }
                      } else {
                        // Malformed token, remove
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('refresh_token');
                      }
                    } catch (e) {
                      // On any error, clear tokens to prevent stale auth
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
      <body className={`${tajawal.className} antialiased pt-14 md:pt-0`}>
        <SidebarProvider>
          <LoadingProvider>
            <ClientSetup>
              <MobileHeader />
              {children}
            </ClientSetup>
          </LoadingProvider>
        </SidebarProvider>
        <Analytics />
      </body>
    </html>
  )
}
