import type { Metadata, Viewport } from "next";
import { Cinzel, Nunito } from "next/font/google";
import { Providers } from "@/components/Providers";
import { AuthGate } from "@/components/auth/AuthGate";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DeckPool",
  description: "Personal One Piece TCG deckbuilder — brew from the cards you own.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets page content draw behind iOS Safari's floating toolbar / home indicator.
  viewportFit: "cover",
  themeColor: "#faf3e6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <Providers>
          <AuthGate>{children}</AuthGate>
        </Providers>
      </body>
    </html>
  );
}
