import type { Metadata } from "next";
import { RootShell } from "@/components/site/RootShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  applicationName: SITE.name,
  authors: [{ name: SITE.name }],
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1b21" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function ChineseRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RootShell locale="zh">{children}</RootShell>;
}
