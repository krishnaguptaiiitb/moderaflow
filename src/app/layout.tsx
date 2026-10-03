import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ModeraFlow",
  description: "AI-assisted content moderation and appeals workbench",
};

const navigation = [
  {
    name: "Dashboard",
    href: "/",
  },
  {
    name: "Moderation Queue",
    href: "/queue",
  },
  {
    name: "Appeals",
    href: "/appeals",
  },
  {
    href: "/policies",
    label: "Policies",
  },
  {
    name: "Audit Trail",
    href: "/audit",
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white antialiased">
        <div className="min-h-screen">
          <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-800 bg-slate-950 lg:block">
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-800 px-6 py-6">
                <Link href="/" className="block">
                  <p className="text-sm font-semibold tracking-[0.2em] text-indigo-400">
                    MODERAFLOW
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Moderation Workbench
                  </p>
                </Link>
              </div>

              <nav className="flex-1 px-3 py-6">
                <p className="px-3 text-xs font-medium uppercase tracking-wide text-slate-600">
                  Workspace
                </p>

                <div className="mt-3 space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-slate-100"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </nav>

              <div className="border-t border-slate-800 px-6 py-5">
                <p className="text-xs text-slate-600">
                  AI-assisted · Human controlled
                </p>
              </div>
            </div>
          </aside>

          <div className="lg:pl-64">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}