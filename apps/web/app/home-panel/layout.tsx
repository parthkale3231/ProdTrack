"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  Settings,
  LayoutDashboard,
  LogOut,
  Shield
} from "lucide-react";

import { ProductProvider } from "../../context/ProductContext";
import { ThemeToggle } from "../../components/theme-toggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSignOut = () => {
    router.push("/");
  };

  // Determine current page title based on pathname
  let pageTitle = "Operational Panel";
  if (pathname === "/home-panel/products") {
    pageTitle = "Manage Products";
  } else if (pathname === "/home-panel/analytics") {
    pageTitle = "Dashboard Overview";
  }

  return (
    <ProductProvider>
      <div className="min-h-screen w-full bg-neutral-50 dark:bg-[#030303] text-neutral-900 dark:text-white flex overflow-hidden font-sans relative transition-colors duration-500">
        {/* Background Spotlight Glows */}
        <div
          className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none filter blur-[150px] opacity-60 dark:opacity-100"
          style={{
            background: "radial-gradient(circle, rgba(16,185,129,0.03) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full pointer-events-none filter blur-[150px] opacity-60 dark:opacity-100"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.035) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        {/* Sidebar navigation */}
        <aside
          className={`relative z-20 flex flex-col border-r border-neutral-200 dark:border-neutral-900 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl transition-all duration-300 ${
            isSidebarOpen ? "w-64" : "w-20"
          }`}
        >
          {/* Brand/Logo */}
          <div className="flex h-16 items-center px-6 border-b border-neutral-200 dark:border-neutral-900 justify-between">
            {isSidebarOpen ? (
              <span
                className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent"
                style={{ letterSpacing: "-0.02em" }}
              >
                ProdTrack
              </span>
            ) : (
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">PT</span>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 flex flex-col gap-1.5 p-4">
            <Link
              href="/home-panel"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                pathname === "/home-panel"
                  ? "bg-neutral-200 dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-950"
              }`}
            >
              <Shield className="h-5 w-5 shrink-0" />
              {isSidebarOpen && <span>Operational Panel</span>}
            </Link>

            <Link
              href="/home-panel/products"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                pathname === "/home-panel/products"
                  ? "bg-neutral-200 dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-950"
              }`}
            >
              <Settings className="h-5 w-5 shrink-0" />
              {isSidebarOpen && <span>Manage Products</span>}
            </Link>

            <Link
              href="/home-panel/analytics"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                pathname === "/home-panel/analytics"
                  ? "bg-neutral-200 dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-950"
              }`}
            >
              <LayoutDashboard className="h-5 w-5 shrink-0" />
              {isSidebarOpen && <span>Dashboard</span>}
            </Link>
          </nav>

          {/* User Profile / Logout section */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-900 flex flex-col gap-3">
            {isSidebarOpen && (
              <div className="flex items-center gap-3 px-2">
                <div className="h-9 w-9 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-sm font-bold text-neutral-700 dark:text-neutral-350">
                  JD
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white">John Doe</span>
                  <span className="text-[10px] text-neutral-500">Administrator</span>
                </div>
              </div>
            )}

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-red-500/80 dark:text-red-400/80 hover:text-red-650 dark:hover:text-red-400 hover:bg-red-500/5 dark:hover:bg-red-500/5 transition-all duration-200 cursor-pointer border-none bg-transparent text-left"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {isSidebarOpen && <span>Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto relative z-10">
          {/* Top Header Bar */}
          <header className="flex h-16 items-center px-8 border-b border-neutral-200 dark:border-neutral-900 bg-white/20 dark:bg-neutral-950/20 backdrop-blur-md sticky top-0 z-15 transition-colors duration-500 justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors duration-200 cursor-pointer p-1 rounded-md hover:bg-neutral-200/50 dark:hover:bg-neutral-900 bg-transparent border-none"
                aria-label="Toggle sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {pageTitle}
              </h2>
            </div>

            {/* Header Right theme toggle */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </header>

          {/* Render child pages */}
          {children}
        </div>
      </div>
    </ProductProvider>
  );
}
