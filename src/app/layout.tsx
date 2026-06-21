import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { DemoPanel } from "@/components/DemoPanel";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// The companion voice: a warm serif, reserved for the moments Anchor speaks
// directly to a person (the warm message, status headline, welcome).
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
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
  // Match the canvas token in each theme so mobile browser chrome blends in.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1a17" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`}>
      <body>
        {children}
        <DemoPanel />
      </body>
    </html>
  );
}
