import { Analytics } from "@vercel/analytics/react";
import { Metadata } from "next";
import "../styles/globals.css";

let title = "ArchiteQt Vision — AI Kamer Designer voor Architecten";
let description = "Herontwerp elke ruimte met AI. Upload een foto, kies een stijl, en ontvang een professioneel interieurontwerp in seconden. Door ArchiteQt.";
let ogimage = "https://room-gpt-archite-qt.vercel.app/og-image.png";
let sitename = "ArchiteQt Vision";

export const metadata: Metadata = {
  title,
  description,
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    images: [ogimage],
    title,
    description,
    url: "https://room-gpt-archite-qt.vercel.app",
    siteName: sitename,
    locale: "nl_NL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: [ogimage],
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className="bg-[#0f1117] text-white">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
