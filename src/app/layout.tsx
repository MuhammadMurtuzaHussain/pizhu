import type { Metadata } from "next";
import { IBM_Plex_Sans, Newsreader } from "next/font/google";
import { I18nProvider } from "@/lib/i18n/context";
import "./globals.css";

const ui = IBM_Plex_Sans({ variable: "--font-ui", subsets: ["latin"], weight: ["400", "500", "600"] });
const essay = Newsreader({ variable: "--font-essay", subsets: ["latin"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Pīzhù 批注",
  description: "Margin notes for academic English. An open-source writing tutor for Mandarin-speaking students in the UK and Ireland, powered by Gemma.",
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
