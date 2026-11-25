import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "User Profile",
  path: "/profile",
  noIndex: true,
});

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
