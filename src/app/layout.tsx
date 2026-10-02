import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { Newsreader } from "next/font/google";
import { I18nProvider } from "@/lib/i18n/context";
// 霞鹜文楷 Lite, split by unicode-range so only the characters on screen load.
import "lxgw-wenkai-lite-webfont/lxgwwenkailite-regular.css";
import "./globals.css";

const essay = Newsreader({ variable: "--font-essay", subsets: ["latin"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Pīzhù 批注",
  description: "Margin notes, not rewrites. An open-source writing tutor for Mandarin-speaking students in the UK and Ireland, powered by Gemma.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f3ee" },
    { media: "(prefers-color-scheme: dark)", color: "#131416" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${essay.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
