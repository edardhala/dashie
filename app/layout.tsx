import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
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
  title: "Dashie: Madrid–Segovia ride board for IE students",
  description:
    "Dashie finds IE students a seat between Madrid and Segovia whenever they need one, for every class, exam and IE event.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <main className="w-full flex-1 px-4 py-8 sm:py-12">{children}</main>
        <footer className="bg-ink px-4 py-6 text-center text-sm text-white/75">
          Dashie · Student project, not affiliated with IE University.
        </footer>
      </body>
    </html>
  );
}
