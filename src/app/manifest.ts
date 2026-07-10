import type { MetadataRoute } from "next";

/**
 * Web app manifest: lets a person install Anchor to their phone's home screen
 * and open it standalone, like the daily companion it's meant to be. The app
 * is local-first (localStorage), so once installed it opens straight into
 * their own data with no account.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Anchor: a calm staying-well companion",
    short_name: "Anchor",
    description:
      "Mirrors your own pre-agreed early-warning signs back to you and helps you reach real human support. Not a diagnostic tool.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f6f4ef",
    theme_color: "#f6f4ef",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
