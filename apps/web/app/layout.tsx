import "./globals.css";
import type { ReactNode } from "react";

export const metadata = { title: "Vibe", description: "Playlist → Course" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="text-gray-900">{children}</body>
    </html>
  );
}
