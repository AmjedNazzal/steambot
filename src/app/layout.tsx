import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import Providers from "./components/providers";

const inter = Roboto({ subsets: ["latin"], weight: "400" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta property="og:locale" content="en_US" />
        <meta property="og:title" content="Steambot" />
        <meta
          property="og:description"
          content="Search the Steam store with the help of AI"
        />
        <meta
          property="og:url"
          content="https://steambot-amjed-nazzals-projects.vercel.app/"
        />
        <meta property="og:site_name" content="MyNotes" />
        <meta
          property="og:image"
          content="https://steambot-amjed-nazzals-projects.vercel.app/opengraph-image.jpg"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpg" />
      </head>
      <Providers>
        <body className={inter.className}>{children}</body>
      </Providers>
    </html>
  );
}
