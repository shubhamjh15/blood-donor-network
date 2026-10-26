import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });

export const metadata: Metadata = {
  title: { default: "Bloodline — Find blood donors near you", template: "%s · Bloodline" },
  description: "A real-time, location-based blood donor network. Find compatible donors nearby, post emergency requests and save lives.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 32'><path d='M12 1C12 1 2 13.5 2 20.5C2 26.3 6.5 31 12 31C17.5 31 22 26.3 22 20.5C22 13.5 12 1 12 1Z' fill='%23ff2d55'/></svg>",
  },
};

export const viewport: Viewport = { themeColor: "#07060a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body>
        <Providers>
          <Navbar />
          <main className="relative">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
