import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";
import { SocketProvider } from "@/components/providers/SocketProvider";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Friend Connection App",
  description: "Kết nối những người bạn tuyệt vời nhất với nhau",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} font-montserrat`}>
        <NextAuthProvider>
          <SocketProvider>{children}</SocketProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
