import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Task Matrix & AI Blueprint Organizer",
  description: "Eisenhower Matrix task tracker and AI model blueprint organizer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
