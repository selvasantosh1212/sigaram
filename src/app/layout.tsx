import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { getTimeGreeting } from "@/lib/motivation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sigaram — TNPSC Group 2A Study Tracker",
  description: "119-day study plan + mock tests for TNPSC Group 2A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        <header className="border-b border-zinc-200 bg-white">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3 text-sm font-medium">
            <Link href="/days" className="text-base font-semibold tracking-wide text-zinc-900">
              SIGARAM
            </Link>
            <Link href="/days" className="text-zinc-600 hover:text-zinc-900">
              Reading Mode
            </Link>
            <Link href="/mock-tests" className="text-zinc-600 hover:text-zinc-900">
              Mock Test Mode
            </Link>
            <Link href="/weekly" className="text-zinc-600 hover:text-zinc-900">
              Weekly Tests
            </Link>
            <Link href="/monthly" className="text-zinc-600 hover:text-zinc-900">
              Monthly Tests
            </Link>
            <Link href="/full-mock" className="text-zinc-600 hover:text-zinc-900">
              Full Mock
            </Link>
            <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-900">
              Dashboard
            </Link>
            <Link href="/mistakes" className="text-zinc-600 hover:text-zinc-900">
              Mistakes
            </Link>
            <span className="ml-auto text-zinc-500">{getTimeGreeting()} &#128075;</span>
          </nav>
        </header>
        <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
