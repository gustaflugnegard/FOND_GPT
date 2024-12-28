import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import Navbar from "@/components/navbar";
import "./globals.css";

export const metadata = {
  title: "Svenska Fonder Q&A",
  description: "AI-powered Q&A system for Swedish Funds",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col">
            <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
                <Navbar />
            </nav>

            <div className="flex-1 container">
              {children}
            </div>

            <footer className="border-t border-t-foreground/10 py-6 mt-8">
              <div className="max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
                © 2024 Svenska Fonder
              </div>
            </footer>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}