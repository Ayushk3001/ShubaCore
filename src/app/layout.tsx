import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Return Gift Manager",
  description: "Internal business management system for custom return gifts",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full antialiased">
        <body className="min-h-full bg-background text-foreground">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
