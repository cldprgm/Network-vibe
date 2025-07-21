import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/sidebar/sidebar";
import type { Viewport } from 'next'
import Navbar from "@/components/header/navbar";
import ClientRoot from "@/components/ClientRoot";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Network",
  description: "Social Network",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-[5] mt-[60px] sm:mt-[30px] md:mt-[0px]">
            {children}
          </main>
        </div>
        <ClientRoot />

      </body>
    </html>
  );
}
