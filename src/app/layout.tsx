import type { Metadata } from "next";
import { Geist, Geist_Mono, Bangers, Rubik_Gemstones, Cabin_Condensed } from "next/font/google";
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

const bangers = Bangers({
  weight: "400",
  variable: "--font-bangers",
  subsets: ["latin"],
});

const rubikGemstones = Rubik_Gemstones({
  weight: "400",
  variable: "--font-rubik-gemstones",
  subsets: ["latin"],
});

export const cabinCondensed = Cabin_Condensed({
  weight: "400",
  variable: "--font-cabin-condensed",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LSChatApp",
  description: "Connect with friends and colleagues securely",
};


export default function RootLayout({children}: Readonly<{children: React.ReactNode;}>) 
{
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script src="https://cdn.pubnub.com/sdk/javascript/pubnub.7.4.5.min.js" strategy="afterInteractive" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bangers.variable} ${rubikGemstones.variable} ${cabinCondensed.variable} antialiased hydration-fix`}
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
