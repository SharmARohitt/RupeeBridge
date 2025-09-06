import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Providers from "@/components/providers/Providers";
import "./globals.css";
import '@rainbow-me/rainbowkit/styles.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RupeeBridge - Digital INR Gateway on Arbitrum",
  description: "Seamlessly convert INR to crypto, earn yield, and transact globally with arbINR - India's digital rupee on Arbitrum blockchain.",
  keywords: "RupeeBridge, arbINR, digital rupee, Arbitrum, DeFi, stablecoin, INR",
  authors: [{ name: "RupeeBridge Team" }],
  openGraph: {
    title: "RupeeBridge - Digital INR Gateway on Arbitrum",
    description: "India's premier digital rupee platform on Arbitrum blockchain",
    url: "https://rupeebridge.com",
    siteName: "RupeeBridge",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RupeeBridge - Digital INR Gateway",
    description: "Seamlessly convert INR to crypto on Arbitrum",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
