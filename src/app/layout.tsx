import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DemoPanel } from "@/components/DemoPanel";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anchor: a calm staying-well companion",
  description:
    "Anchor mirrors your own pre-agreed early-warning signs back to you and helps you reach real human support. Not a diagnostic tool.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Matches the canvas token so mobile browser chrome blends in.
  themeColor: "#f5f4ef",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        <DemoPanel />
      </body>
    </html>
  );
}
