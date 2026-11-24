import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import Footer from "@/components/Footer";
import { buildMetadata } from "@/lib/seo";
import { AuthProvider } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import CollectionPickerModal from "@/components/CollectionPickerModal";

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
                  if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
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
        </AuthProvider>
      </body>
    </html>
  );
}
