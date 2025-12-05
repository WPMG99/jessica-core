import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jessica - Cognitive Prosthetic",
  description: "Battle buddy AI for disabled veterans. For the forgotten 99%, we rise.",
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-zinc-800"
    >
      {children}
    </Link>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#0a0a0a]">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                <span className="text-white font-bold text-sm">J</span>
              </div>
              <span className="font-semibold text-white">Jessica</span>
            </Link>
            
            <div className="flex items-center gap-1">
              <NavLink href="/">Chat</NavLink>
              <NavLink href="/status">Status</NavLink>
              <NavLink href="/memory">Memory</NavLink>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="pt-14">
          {children}
        </main>
      </body>
    </html>
  );
}
