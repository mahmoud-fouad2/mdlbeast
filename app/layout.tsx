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
      },      {
        url: "/favicon.ico",
        type: "image/x-icon",
      },    ],
    apple: "/apple-icon.png",
  },
}

// Use dedicated viewport export for Next.js app router
export const viewport = {
  width: 'device-width',
  initialScale: 1,
}


import { LoadingProvider } from "../components/ui/loading-context"
import SessionExpiredModal from '@/components/SessionExpiredModal'
import SafeAnalytics from '@/components/SafeAnalytics'
import AppVersionAutoReloader from '@/components/AppVersionAutoReloader'
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <head>
        {/* Prevent aggressive caching of the HTML shell so clients revalidate frequently */}
        <meta httpEquiv="Cache-control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        {/* Inline, tiny version/checker & defensive polyfills: runs before any main bundle to force-reload clients if server reports a new version or if a small JS probe returns HTML (indicative of 404/CDN error). Also patches environment where constructing MessageChannel or CustomEvent throws (prevents "Illegal constructor" crashes). */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{
  // Defensive: some environments/proxies/extensions throw when calling native constructors (MessageChannel, CustomEvent).
  // Provide safe fallbacks to avoid runtime "Illegal constructor" errors in downstream bundles.
  try {
    // Test MessageChannel usage; replace with a tiny polyfill if constructing it throws
    try { new MessageChannel(); } catch (e) {
      (function(){
        function Port(){ this.onmessage = null; }
        Port.prototype.postMessage = function(msg){ var self=this; setTimeout(function(){ try{ if (typeof self.onmessage === 'function') self.onmessage({ data: msg }); }catch(e){} }, 0); };
        window.MessageChannel = function(){ return { port1: new Port(), port2: new Port() } };
      })();
    }
  } catch(e) { /* ignore */ }
  try {
    // Test CustomEvent; provide old-style init-based polyfill if constructing fails
    try { new CustomEvent('__zaco_test', { detail: {} }); } catch (e) {
      (function(){
        function CustomEventPoly(type, params){ params = params || { bubbles: false, cancelable: false, detail: null }; var ev = document.createEvent('CustomEvent'); ev.initCustomEvent(type, params.bubbles, params.cancelable, params.detail); return ev; }
        CustomEventPoly.prototype = (window.Event || function(){}).prototype;
        window.CustomEvent = CustomEventPoly;
      })();
    }
  } catch(e) { /* ignore */ }

  var now = Date.now();
  var prev=null; try{prev=localStorage.getItem('app_version')}catch(e){}
  // version check
  fetch('/api/version?_t='+now,{cache:'no-store',credentials:'same-origin'}).then(function(r){return r.text()}).then(function(t){try{var v=JSON.parse(t);var s=(v.version||'')+'@'+(v.commit||'');if(prev!==s){try{localStorage.setItem('app_version',s)}catch(e){}var u=new URL(window.location.href);u.searchParams.set('_t',Date.now());window.location.replace(u.toString())}}catch(e){/* ignore non-json */}}).catch(function(){})
  // probe a tiny static JS file to ensure assets are being served as JS and not returning HTML or an error page
  fetch('/asset-check.js?_t='+now,{cache:'no-store',credentials:'same-origin'}).then(function(r){
    var ct = (r.headers && r.headers.get && r.headers.get('content-type')) || '';
    if (/text\/html/i.test(ct)) throw new Error('asset returned html');
    return r.text()
  }).then(function(body){
    if (!body || body.trim().charAt(0)==='<') throw new Error('asset looks like HTML');
    // probe ok
  }).catch(function(){
    // If probe failed, attempt immediate cache-busting replace to pick up correct assets
    try{var u2=new URL(window.location.href);u2.searchParams.set('_t',Date.now());window.location.replace(u2.toString());}catch(e){}
  })
}catch(e){} })();` }} />
      </head>
      <body className={`${tajawal.className} antialiased`}>
        <LoadingProvider>
          {children}
        </LoadingProvider>
        <SessionExpiredModal />
        <script dangerouslySetInnerHTML={{__html: `if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'development') { console.log = function(){}; }`}} />
        {/* Safe analytics loader: loads analytics dynamically in client and fails quietly if unsupported */}
        <SafeAnalytics />
        {/* Auto-reloader: silently force-refresh clients when a new server version is detected (no banner/dialog) */}
        <AppVersionAutoReloader />
      </body>
    </html>
  )
}
