import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nigeria Economic Pulse",
  description:
    "Interactive dashboard tracking Nigeria's key economic indicators — GDP, inflation, exchange rates, and state-level data.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased font-[family-name:var(--font-body)]">
        {children}
      </body>
    </html>
  );
}