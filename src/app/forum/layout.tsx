import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Manga Community Forum — Chapter Drops & Discussions",
  description:
    "Join the MangaPulse community to discuss weekly chapter drops, share official reading recommendations, and talk manga with fellow fans.",
  path: "/forum",
});

export default function ForumLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
