import type { Metadata, Viewport } from "next";
import "./globals.css";
import BroadcastBanner from "@/components/BroadcastBanner";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import Footer from "@/components/Footer";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { AuthProvider } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import CollectionPickerModal from "@/components/CollectionPickerModal";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { Analytics } from "@vercel/analytics/react";

export const viewport: Viewport = {
  themeColor: "#0c0e12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  ...buildMetadata({
    title: "MangaPulse — 100% Legal Manga Tracker & Chapter Release Countdown",
    description:
      "Real-time countdown timers for upcoming chapters of One Piece, Chainsaw Man, Solo Leveling, and Jujutsu Kaisen. Official Where to Read and Buy directory with personal reading library tracking and custom collections.",
    path: "/",
  }),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MangaPulse",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Schema.org Knowledge Graph */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${SITE_URL}/#organization`,
                  "name": "MangaPulse",
                  "url": SITE_URL,
                  "logo": {
                    "@type": "ImageObject",
                    "@id": `${SITE_URL}/#logo`,
                    "url": `${SITE_URL}/icon.png`,
                    "caption": "MangaPulse"
                  },
                  "sameAs": [
                    "https://x.com/mangapulse",
                    "https://discord.gg/mangapulse"
                  ]
                },
                {
                  "@type": "WebSite",
                  "@id": `${SITE_URL}/#website`,
                  "url": SITE_URL,
                  "name": "MangaPulse",
                  "description": "100% Legal Manga Tracker, Chapter Release Countdown & Official Directory",
                  "publisher": {
                    "@id": `${SITE_URL}/#organization`
                  },
                  "potentialAction": [
                    {
                      "@type": "SearchAction",
                      "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": `${SITE_URL}/search/manga?q={search_term_string}`
                      },
                      "query-input": "required name=search_term_string"
                    }
                  ]
                }
              ]
            })
          }}
        />

        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4938022536946038"
          crossOrigin="anonymous"
        />

        {/* Google Tag Manager */}
        <script
          async
          src="https://www.googletagmanager.com/gtm.js?id=GTM-5MN6TQ2G"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
            `,
          }}
        />

        {/* Mangareader Analytics */}
        <script
          defer
          src="https://analytics.mangareader.pro/script.js"
          data-website-id="fe98be64-6eec-45cb-9f7a-9bc786d5edc2"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('mangapulse_theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'light') {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js').catch(function(){});
                    });
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased bg-[#0c0e12] text-[#f0f3f8] selection:bg-blue-600/30 selection:text-white max-w-[100vw] overflow-x-hidden">
        {/* Google Tag Manager (noscript fallback) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5MN6TQ2G"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <AuthProvider>
          <BroadcastBanner />
          <Navbar />
          <main className="flex-1 min-w-0 max-w-full overflow-x-hidden">{children}</main>
          <MobileNav />
          <Footer />
          <AuthModal />
          <CollectionPickerModal />
          <PWAInstallPrompt />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
