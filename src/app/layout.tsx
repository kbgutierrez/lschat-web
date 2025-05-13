import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LS Chat App",
  description: "Connect with friends and colleagues securely",
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode;}>) 
{
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased hydration-fix`}
        suppressHydrationWarning
      >
        {children}
        <Script id="hydration-script">
          {`document.body.classList.remove('hydration-fix'); document.body.classList.add('hydrated');`}
        </Script>
      </body>
    </html>
  );
}
