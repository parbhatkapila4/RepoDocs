import type { Metadata } from "next";
import "@/app/globals.css"
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/provider/ThemeProvider";
import { ReduxProvider } from "@/provider/ReduxProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RepoDocs — Auto-generate README & Docs from any GitHub repo",
  description: "Paste a GitHub URL and generate professional README, architecture diagrams, and shareable docs. Sign in with GitHub. Built with Next.js, Clerk, Prisma.",
  keywords: ["GitHub", "README", "documentation", "developer tools", "open source", "repo analysis"],
  authors: [{ name: "RepoDocs Team" }],
  creator: "RepoDocs",
  publisher: "RepoDocs",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://repodoc.dev"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "RepoDoc — Auto-generate README & Docs from any GitHub repo",
    description: "Paste a GitHub URL and generate professional README, architecture diagrams, and shareable docs. Sign in with GitHub.",
    url: "https://repodoc.dev",
    siteName: "RepoDoc",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RepoDocs - Generate docs from GitHub repos",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RepoDocs — Auto-generate README & Docs from any GitHub repo",
    description: "Paste a GitHub URL and generate professional README, architecture diagrams, and shareable docs.",
    images: ["/og-image.png"],
    creator: "@repodoc",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <ReduxProvider>
        <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
          {children}
          </ThemeProvider>
          <Toaster />
        </ReduxProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
