import type { Metadata } from "next";
import { inter, merriweather } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/components/auth/auth-provider";
import "./globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: "ISAA (International School Academic Alliance)",
  description: "A collaborative platform for international school students to share ideas and discover academic events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          merriweather.variable
        )}
      >
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 md:px-8 py-6">{children}</main>
            <footer className="border-t py-6">
              <div className="container mx-auto px-4 md:px-8 flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                  &copy; {new Date().getFullYear()} International School Academic Alliance. Built for academic excellence.
                </p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
