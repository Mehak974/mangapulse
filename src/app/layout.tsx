import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import Footer from "@/components/Footer";
import { buildMetadata } from "@/lib/seo";
import { AuthProvider } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import CollectionPickerModal from "@/components/CollectionPickerModal";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
                  "@id": "https://mangapulse.co/#organization",
                  "name": "MangaPulse",
                  "url": "https://mangapulse.co",
                  "logo": {
                    "@type": "ImageObject",
                    "@id": "https://mangapulse.co/#logo",
                    "url": "https://mangapulse.co/icon.png",
                    "caption": "MangaPulse"
                  },
                  "sameAs": [
                    "https://x.com/mangapulse",
                    "https://discord.gg/mangapulse"
                  ]
                },
                {
                  "@type": "WebSite",
                  "@id": "https://mangapulse.co/#website",
                  "url": "https://mangapulse.co",
                  "name": "MangaPulse",
                  "description": "100% Legal Manga Tracker, Chapter Release Countdown & Official Directory",
                  "publisher": {
                    "@id": "https://mangapulse.co/#organization"
                  },
                  "potentialAction": [
                    {
                      "@type": "SearchAction",
                      "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": "https://mangapulse.co/search/manga?q={search_term_string}"
                      },
                      "query-input": "required name=search_term_string"
                    }
                  ]
                }
              ]
            })
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
      <body className="min-h-screen flex flex-col antialiased bg-[#0c0e12] text-[#f0f3f8] selection:bg-blue-600/30 selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <MobileNav />
          <Footer />
          <AuthModal />
          <CollectionPickerModal />
          <PWAInstallPrompt />
          <Analytics />
          <SpeedInsights />
        </AuthProvider>
      </body>
    </html>
  );
}
