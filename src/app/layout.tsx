import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";
import { SocketProvider } from "@/components/providers/SocketProvider";

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Love Connection App",
  description: "Connect with people who share your interests",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-poppins`}>
        <NextAuthProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
