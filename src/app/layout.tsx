import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pythagoras Lab — Perigal's Dissection | Grade 8 Interactive Math",
  description:
    "An interactive English-medium learning tool for Grade 8: discover the Pythagorean Theorem (a² + b² = c²) through Henry Perigal's visual dissection proof. Explore areas, cut and assemble puzzle pieces, take quizzes.",
  keywords: [
    "Pythagorean theorem",
    "Perigal dissection",
    "grade 8 math",
    "interactive learning",
    "geometry",
    "a2 + b2 = c2",
  ],
  authors: [{ name: "Pythagoras Lab" }],
  openGraph: {
    title: "Pythagoras Lab — Perigal's Dissection",
    description:
      "Discover a² + b² = c² by cutting and assembling squares. Interactive guided-discovery media for Grade 8.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
