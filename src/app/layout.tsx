import type { Metadata, Viewport } from "next";
import { Newsreader, Outfit } from "next/font/google";
import { I18nProvider } from "@/lib/i18n/context";
// 霞鹜文楷 Lite, split by unicode-range so only the characters on screen load.
import "lxgw-wenkai-lite-webfont/lxgwwenkailite-regular.css";
import "./globals.css";

const ui = Outfit({ variable: "--font-ui", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const essay = Newsreader({ variable: "--font-essay", subsets: ["latin"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Pīzhù 批注",
  description: "Margin notes, not rewrites. An open-source writing tutor for Mandarin-speaking students in the UK and Ireland, powered by Gemma.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8ff" },
    { media: "(prefers-color-scheme: dark)", color: "#16121e" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${ui.variable} ${essay.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
