import type { Metadata } from "next";
import "@fontsource-variable/inter/standard.css";
import "@fontsource-variable/dm-sans/standard.css";
import "@fontsource-variable/manrope/standard.css";
import "@fontsource-variable/space-grotesk/standard.css";
import "@fontsource-variable/outfit/standard.css";
import "@fontsource-variable/roboto/standard.css";
import "@fontsource-variable/nunito-sans/standard.css";
import "@fontsource-variable/playfair-display/standard.css";
import "@fontsource-variable/montserrat/standard.css";
import "@fontsource/lora/400.css";
import "@fontsource/lora/700.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/oswald/400.css";
import "@fontsource/oswald/500.css";
import "@fontsource/oswald/700.css";
import "@fontsource/merriweather/400.css";
import "@fontsource/merriweather/700.css";
import "@fontsource/archivo/400.css";
import "@fontsource/archivo/500.css";
import "@fontsource/archivo/700.css";
import "@fontsource/bebas-neue/400.css";
import "@fontsource/caveat/400.css";
import "@fontsource/caveat/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "SlideAI Studio — Presentations, reimagined",
  description:
    "Create clear, compelling presentations with an AI-powered creative workspace.",
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
