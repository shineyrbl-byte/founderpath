import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FounderPath: your AI co-founder",
  description: "Turn a raw idea into a validated plan, a build roadmap and your first users.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/80 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3 text-sm">
            <Link href="/" className="flex items-center gap-2 font-semibold text-stone-900">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-600 text-white">⟡</span>
              FounderPath
            </Link>
            <div className="ml-auto flex items-center gap-5 text-stone-600">
              <Link href="/ideas" className="hover:text-stone-900">My ideas</Link>
              <Link href="/cohort" className="hover:text-stone-900">For incubators</Link>
              <Link href="/new" className="rounded-lg bg-indigo-600 px-3.5 py-1.5 font-medium text-white hover:bg-indigo-700">
                Start free
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500">
          FounderPath, built for the Next Founders hackathon
        </footer>
      </body>
    </html>
  );
}
