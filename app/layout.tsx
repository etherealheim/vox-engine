import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "../lib/utils";
import { ThemeProvider } from "./components/shared/theme-provider";
import { Toaster } from "./components/ui/toaster";

// Define fonts with display swap for better performance
const ibmPlexSans = IBM_Plex_Sans({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({ 
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Vox Engine",
    template: "%s | Vox Engine",
  },
  description: "Data collection and analysis engine for political data",
  keywords: ["politics", "data analysis", "voting records", "twitter analysis"],
  authors: [{ name: "Vox Engine Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Vox Engine",
    description: "Data collection and analysis engine for political data",
    siteName: "Vox Engine",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      className={cn(
        ibmPlexSans.variable,
        ibmPlexMono.variable,
      )}
      suppressHydrationWarning
    >
      <body className={cn(
        ibmPlexSans.className,
        "min-h-screen bg-background text-foreground antialiased"
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <nav className="container flex h-16 items-center justify-between py-4">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">Vox Engine</h1>
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">Beta</span>
                </div>
              </nav>
            </header>
            <main className="container flex-1 py-8">{children}</main>
            <footer className="border-t py-6 md:py-0">
              <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
                <p className="text-center text-sm text-muted-foreground md:text-left">
                  © {new Date().getFullYear()} Vox Engine. All rights reserved.
                </p>
                <p className="text-center text-sm text-muted-foreground md:text-right">
                  Built with <span className="font-mono">Next.js</span> and <span className="font-mono">shadcn/ui</span>
                </p>
              </div>
            </footer>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
