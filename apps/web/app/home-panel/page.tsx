"use client";
import Link from "next/link";
import { Settings, LayoutDashboard, ChevronRight } from "lucide-react";

export default function DashboardHome() {
  return (
    <main className="flex-1 p-8 md:p-12 flex flex-col justify-between relative">
      <div className="max-w-4xl mx-auto w-full flex flex-col justify-center flex-1 my-auto">
        <div className="flex flex-col gap-10">
          {/* Intro Hero Section */}
          <div className="text-center flex flex-col gap-2.5 max-w-lg mx-auto">
            <h3 className="text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400 leading-none">
              Operations Portal
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Welcome to the ProdTrack operational dashboard. Select a workspace module to begin managing resources.
            </p>
          </div>

          {/* Grid Cards (Manage Products & Dashboard) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto w-full">
            {/* Manage Products Card */}
            <Link
              href="/home-panel/products"
              className="group relative flex flex-col gap-6 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-900 bg-white/80 dark:bg-neutral-950/40 hover:bg-neutral-100/60 dark:hover:bg-neutral-950/80 transition-all duration-300 cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-700 overflow-hidden shadow-sm hover:shadow-md"
            >
              {/* Glowing effect inside card */}
              <div
                className="absolute -right-16 -top-16 w-36 h-36 rounded-full pointer-events-none filter blur-2xl group-hover:opacity-100 opacity-40 transition-opacity duration-300"
                style={{
                  background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
                }}
              />
              
              {/* Card Icon Wrapper */}
              <div className="h-14 w-14 rounded-xl bg-neutral-100 border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 flex items-center justify-center text-emerald-650 dark:text-emerald-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-300 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/[0.03] transition-all duration-300">
                <Settings className="h-7 w-7 transition-transform duration-500 group-hover:rotate-45" />
              </div>

              <div className="flex flex-col gap-2">
                <h4 className="text-lg font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors duration-200">
                  Manage Products
                  <ChevronRight className="h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Add, customize, configure, and inspect product details, inventory lines, and tracking stages.
                </p>
              </div>
            </Link>

            {/* Dashboard Card */}
            <Link
              href="/home-panel/analytics"
              className="group relative flex flex-col gap-6 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-900 bg-white/80 dark:bg-neutral-950/40 hover:bg-neutral-100/60 dark:hover:bg-neutral-950/80 transition-all duration-300 cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-700 overflow-hidden shadow-sm hover:shadow-md"
            >
              {/* Glowing effect inside card */}
              <div
                className="absolute -right-16 -top-16 w-36 h-36 rounded-full pointer-events-none filter blur-2xl group-hover:opacity-100 opacity-40 transition-opacity duration-300"
                style={{
                  background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
                }}
              />
              
              {/* Card Icon Wrapper */}
              <div className="h-14 w-14 rounded-xl bg-neutral-100 border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 flex items-center justify-center text-indigo-650 dark:text-indigo-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/[0.03] transition-all duration-300">
                <LayoutDashboard className="h-7 w-7 transition-transform duration-300 group-hover:scale-105" />
              </div>

              <div className="flex flex-col gap-2">
                <h4 className="text-lg font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors duration-200">
                  Analytics Dashboard
                  <ChevronRight className="h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                </h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Monitor real-time workflow performance metrics, sprint tracking tables, and data logs.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Clean custom footer */}
      <footer className="text-center text-[11px] tracking-wider uppercase text-neutral-400 dark:text-neutral-700 mt-12">
         &copy; {new Date().getFullYear()} ProdTrack. All rights reserved.
      </footer>
    </main>
  );
}
