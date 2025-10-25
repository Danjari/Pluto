// apps/web/app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";

export const metadata = { title: "Vibe", description: "Playlist → Course" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
