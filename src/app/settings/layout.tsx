import { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Account Settings",
  path: "/settings",
  noIndex: true,
});

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
