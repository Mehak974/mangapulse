import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "My Manga Library",
  path: "/library",
  noIndex: true,
});

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
