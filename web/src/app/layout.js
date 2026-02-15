import { Inter } from "next/font/google";
import { Auth0Provider } from "@auth0/nextjs-auth0";
import Navbar from "@/components/Navbar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "SnapFind — Find Your Event Photos",
  description:
    "Upload event photos, and our facial recognition automatically finds and delivers photos to the people in them.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.variable} style={{ fontFamily: "var(--font-sans)" }}>
        <Auth0Provider>
          <Navbar />
          <main>{children}</main>
        </Auth0Provider>
      </body>
    </html>
  );
}
