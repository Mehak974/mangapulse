import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import Footer from "@/components/Footer";
import { buildMetadata } from "@/lib/seo";
import { AuthProvider } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import CollectionPickerModal from "@/components/CollectionPickerModal";

export const metadata: Metadata = buildMetadata({
  title: "MangaPulse — 100% Legal Manga Tracker & Chapter Release Countdown",
  description:
    "Real-time countdown timers for upcoming chapters of One Piece, Chainsaw Man, Solo Leveling, and Jujutsu Kaisen. Official Where to Read and Buy directory with personal reading library tracking and custom collections.",
  path: "/",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
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
